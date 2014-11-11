ProJack.calendar = angular.module("CalendarModule", ['Utils', 'MileStonesModule', 'TemplateModule']);
ProJack.calendar.service("CalendarService", ['$http', '$q', 'KT', 'MilestoneService', function($http, $q, KT, mService) {
	
	return {
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
					console.log(retval);
					return retval;
				});
		},
		
		transformMilestone : function(milestone) {
			var q = {
					customer : milestone.customer.name || "",
					version  : milestone.version || "",
			};
			return q;
		},
		
		
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
		
		printReport : function(model, template, type) {
			
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
					var w = window.open('data:application/pdf;base64,' + d);
				});
			});
		}
	}
}]);

ProJack.calendar.controller('CalendarIndexController', ['$scope', 'KT', 'CalendarService', 'MilestoneService', 
                                                        function($scope, KT, service, mService) {

	$scope.totalPayments = 0;
	$scope.developmentHours = 0;
	
	$scope.currentMonth = new Date().getMonth() + 1;
	$scope.currentYear  = new Date().getFullYear();
	
	$scope.focusedMilestone = undefined;
	
	// the template selection for printing the milestone
	$scope.template = { _id : undefined };

	
	$scope.getEntries = function() {
		$scope.totalPayments = 0;
		service.getEntries($scope.currentYear, $scope.currentMonth).then(function(entries) {
			$scope.entries = entries;
			
			for (var i in $scope.entries) {
				var e = $scope.entries[i];
				for (var q in e.payments) {
					mService.getAggregation(e.payments[q]).then(function(data) {
						$scope.totalPayments += data.budget;
					});
				}
			}
		});
	};
	$scope.getEntries();
	
	
	$scope.showDetails = function(doc) {
		if (doc.type == 'milestone')
			$scope.focusedMilestone = doc;
	};
	
	$scope.printReport = function(type) {
		var model = service.transformToReportModel($scope.entries);
		service.printReport(model, $scope.template, type);
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