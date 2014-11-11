/**
 * Calendar Module
 * Displays the timefeed (milestones, other events) in a table and generates reports
 * @author: M.Fischboeck
 */
ProJack.calendar = angular.module("CalendarModule", ['Utils', 'MileStonesModule', 'TemplateModule', 'SecurityModule']);


/**
 * Service to fetch data from the db and transforming the model into a format used for displaying in the 
 * calendar view and in reports.
 */
ProJack.calendar.service("CalendarService", ['$http', '$q', 'KT', 'MilestoneService', function($http, $q, KT, mService) {
	
	return {
		newAssignment : function(date, user) {
			return {
				type : 'assignment',
				user : user.login,
				date : date,
				lower : {
					milestone : '',
					laneColor : 'ffffff'
				},
				upper : {
					milestone : '',
					laneColor : 'ffffff',
				}
			}
		},
		
		
		saveAssignments : function(assignments) {
			var def = $q.defer();
			$http.post(ProJack.config.dbUrl + '/_bulk_docs', { docs : assignments }).success(function(response) {
				
				// update revision numbers on each assignment
				for (var i in response.data) {
					var a = KT.find('_id', response.data[i].id, assignments);
					if (a) {
						a._rev = response.data[i].rev;
					}
				}
				def.resolve(response);
			}).error(function() {
				def.reject();
			});
			return def.promise;
		},
		
		getAllAssignments : function(lowerDate, upperDate) {
			var key = 'startkey=["' + lowerDate + '"]&endkey=["' + upperDate + '"]';
			return $http.get(ProJack.config.dbUrl + "/_design/assignments/_view/byDateAndUser?" + key).then(function(response) {
				var retval = [];
				for (var i in response.data.rows) {
					retval.push(response.data.rows[i].value);
				}
				return retval;
			});
		},
		
		deleteAssignment : function(assignment) {
			return $http({
				url : ProJack.config.dbUrl + "/" + assignment._id + '?rev=' + assignment._rev,
				method : 'DELETE'
			});
		},
		
		/**
		 * Fetches all entries from the couch timefeed for milestones
		 */
		getEntries : function(year, month) {
			return $http.get(ProJack.config.dbUrl + '/_design/timefeed/_view/milestones?startKey=['+year+','+month+',0,"MILESTONE", 0]&endKey=['+year+','+month+',31,"MILESTONE", 3]')
				.then(function(response) {
					var retval = {};
					
					var dLimit = moment(year + '-' + month + '-01').endOf('month').date();
					
					for (var i = 1; i < dLimit +1; i++) {
						var rk = year + "-" + month + "-" + i;
						var rd = new Date(rk).getTime();
						retval[rd] = {
								specsdone: [],
								releases : [],
								payments : [],
								approvals: []
						};
						
						for (var q in response.data.rows) {

							var e = response.data.rows[q];
							var k = e.key[0] + "-" + e.key[1] + "-" + e.key[2];
							if (k == rk) {
								var milestone = e.value;
								if (e.key[4] == 0)
									retval[rd]['specsdone'].push(milestone);
								if (e.key[4] == 1)
									retval[rd]['approvals'].push(milestone);
								if (e.key[4] == 2)
									retval[rd]['releases'].push(milestone);
								if (e.key[4] == 3)
									retval[rd]['payments'].push(milestone);
							}
						}
					}
					return retval;
				});
		},
	
		
		/**
		 * Transforms a single milestone into a more lightweight form.
		 * This could be used in reports, where not all milestone data is required
		 */
		transformMilestone : function(milestone) {
			var q = {
					customer : milestone.customer.name || "",
					version  : milestone.version || "",
			};
			return q;
		},
		
		
		/**
		 * Transforms the calendar into a model suitable for reporting
		 */
		transformToReportModel : function(entries) {
			var retval = {
				month : '',
				year  : '',
				income : 0,
				days : []
			};
			
			for (var i in entries) {
				var m = moment(parseInt(i)).locale('de');
				var d = {
						date : m.format("DD.MM.YYYY"),
						events : []
				}
				for (var k in entries[i]['specsdone']) {
					var milestone = entries[i]['specsdone'][k];
					d.events.push( { type : 0, milestone : this.transformMilestone(milestone) });
				}
				for (var k in entries[i]['approvals']) {
					var milestone = entries[i]['approvals'][k];
					d.events.push( { type : 1, milestone : this.transformMilestone(milestone) });
				}
				for (var k in entries[i]['releases']) {
					var milestone = entries[i]['releases'][k];
					d.events.push( { type : 2, milestone : this.transformMilestone(milestone) });
				}
				for (var k in entries[i]['payments']) {
					var milestone = entries[i]['payments'][k];
					var budget    = mService.getMilestoneBudget(milestone).budget;
					retval.income += budget;
					d.events.push( { type : 3, milestone : this.transformMilestone(milestone), income : mService.getMilestoneBudget(milestone).budget });
				}
				retval.days.push(d);
			}
			
			retval.month = m.format("MMMM");
			retval.year  = m.format("YYYY");
			console.log(retval);
			return retval;
		},
		
		
		/**
		 * Generates a report from the given parameters and opens a new browser view displaying the output.
		 * Currently only supports milestone documents, but more could be added easily if required.
		 * The
		 * @param model - The data model to be transformed
		 * @param template - Object containing the _id of the attachment to be used
		 * @param type - Currently only 'PDF' is supported
		 */
		printReport : function(model, template, type) {
		
			// currently only PDF is supported
			if (!type || type !== 'PDF') type = 'PDF';
			
			// load the attachment
			$http({
				method : 'GET',
				url    : ProJack.config.dbUrl + '/' + template._id + '?attachments=true',
				headers: {'Accept' : 'application/json'}
			}).then(function(response) {
				var name = undefined;
				for (var i in response.data._attachments) {
					name = i;
					break;
				}
				var attachment = response.data._attachments[name];
				
				var data = {
						template : attachment.data,
						model    : JSON.stringify(model),
						filename : 'Report-' + model.month + '-' + model.year + '.' + type.toLowerCase()
				};
				
				$http.post(ProJack.config.serviceUrl + '/reports?type=' + type, data).success(function(d) {
					var w = window.open('data:application/pdf;base64,' + d, '_blank');
				});
			});
		}
	}
}]);

/**
 * Controller for the index page of the calendar
 */
ProJack.calendar.controller('CalendarIndexController', ['$scope', 'KT', 'CalendarService', 'MilestoneService', 'SecurityService',
                                                        function($scope, KT, service, mService, secService) {

	// aggregation data
	$scope.totalPayments = 0;
	$scope.developmentHours = 0;
	$scope.totalTime = 0;

	// the current month / year selection
	$scope.currentMonth = new Date().getMonth() + 1;
	$scope.currentYear  = new Date().getFullYear();

	// currently unused
	$scope.focusedMilestone = undefined;
	
	// the template selection for printing the milestone
	$scope.template = { _id : undefined };
	
	// the list of assignemnts
	$scope.assignments = [];
	
	// show only releases and approvals
	$scope.laneFilter = false;


	/**
	 * Fetches all entries for the calendar
	 */
	$scope.getEntries = function() {
		
		// reset aggregation data on each call
		$scope.totalPayments = 0;
		$scope.developmentHours = 0;
		$scope.totalTime = 0;
	
		// fetch the entries for the current month / year selection
		service.getEntries($scope.currentYear, $scope.currentMonth).then(function(entries) {
			$scope.entries = entries;
			
			// fetch milestone data aggregation for each milestone
			var keys = [];
			for (var i in $scope.entries) {
				keys.push(i);
				var e = $scope.entries[i];
				for (var q in e.payments) {
					mService.getAggregation(e.payments[q]).then(function(data) {
						$scope.totalPayments += data.budget;
						
						var q = data.developmentTime.split(":");
						$scope.developmentHours += (parseInt(q[0]) * 3600) + (parseInt(q[1]) * 60);
						
						var q = data.totalTime.split(":");
						$scope.totalTime += (parseInt(q[0]) * 3600) + (parseInt(q[1]) * 60);
					});
				}
				

			}
		
			service.getAllAssignments(keys[0], keys[keys.length -1]).then(function(assignments) {
				$scope.assignments = assignments;
			});
			
			secService.getAllUserNames().then(function(users) {
				$scope.users = users;
			});
		});
	};
	
	// initially load all entries
	$scope.getEntries();
	
	/**
	 * Shows details for the given document
	 * currently not used
	 */
	$scope.showDetails = function(doc) {
		if (doc.type == 'milestone')
			$scope.focusedMilestone = doc;
	};
	
	$scope.printReport = function(type) {
		var model = service.transformToReportModel($scope.entries);
		service.printReport(model, $scope.template, type);
	};
	
	
	$scope.saveAssignments = function() {
		service.saveAssignments($scope.assignments).then(function() {
			KT.alert('Alle Zuweisungen wurden gespeichert');
		});
	};
	
	$scope.getAssignment = function(date, user) {
		for (var i in $scope.assignments) {
			var a = $scope.assignments[i];
			if (a.date == date && a.user == user.login) {
				return a;
			}
		}
		
		// not found ... return white
		return { lower : { laneColor : 'ffffff' }, upper : { laneColor : 'ffffff' } };
	},
	
	$scope.assignSlice = function(date, user, loru, $event) {
		
		if (!$event.ctrlKey && !$scope.focusedMilestone) {
			KT.alert("Bitte zuerst auf einen Milestone klicken", 'warning');
			return;
		}
		
		// find the assignment or return use a new one
		var assignment = undefined;
		var currentIdx = 0;		// remember for when removing a assignment
		for (var i in $scope.assignments) {
			var a = $scope.assignments[i];
			if (a.date == date && a.user == user.login) {
				assignment = a;
				break;
			}
			currentIdx++;
		}
		
		// if none found and ctrl key is not pressed created a new one and add to assignments
		if (!assignment && !$event.ctrlKey) {
			assignment = service.newAssignment(date, user);
			$scope.assignments.push(assignment);
		}
		
		if (!$event.ctrlKey) {
			assignment[loru].milestone = $scope.focusedMilestone._id;
			assignment[loru].laneColor = $scope.focusedMilestone.laneColor;
		} else {
			assignment[loru].milestone = '';
			assignment[loru].laneColor = 'ffffff';
		
			// if both slots are empty purge the assignment
			if (assignment['lower'].milestone.length == 0 && assignment['upper'].milestone.length == 0) {
				service.deleteAssignment(assignment).success(function() {
					$scope.assignments.splice(currentIdx, 1);
				});
			}
		}
	};
	
	
	$scope.getTotalTime = function(milestone) {
		return mService.getMilestoneBudget(milestone).totalTime;
	};
	
	$scope.getFeatureSum = function(milestone, backend) {
		return mService.getFeatureSum(milestone, backend);
	};
	
	$scope.getAssignedTime = function(milestone, backend) {
		
		retval = 0;
		for (var i in $scope.assignments) {
			var a = $scope.assignments[i];
			
			if (a.lower.milestone == milestone._id)
				retval += (4 * 3600);
			if (a.upper.milestone == milestone._id)
				retval += (4 * 3600);
		}
		return retval;
	};
	
	$scope.subMonth = function() {
		$scope.currentMonth--;
		if ($scope.currentMonth == 0) {
			$scope.currentMonth = 12;
			$scope.currentYear--;
		}
		$scope.getEntries();
	};
	
	$scope.addMonth = function() {
		$scope.currentMonth++;
		if ($scope.currentMonth == 13) {
			$scope.currentMonth = 1;
			$scope.currentYear++;
		}
		$scope.getEntries();
	};
	
	
	$scope.isToday = function(date) {
		var d = new Date().getTime();
		return (d >= date && d < date + 3600 * 24);
	};
	
	$scope.isWeekend = function(date) {
		var d = new Date(parseInt(date)).getDay();
		return (d == 0 || d == 6);
	};
}]);