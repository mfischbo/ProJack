
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
		
		getAssignedMilestoneHours : function() {
			return $http.get(ProJack.config.dbUrl + '/_design/assignments/_view/hoursByMilestone?group=true&group_level=1').then(function(response) {
				var retval = {};
				for (var i in response.data.rows) {
					retval[response.data.rows[i].key] = response.data.rows[i].value;
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
								for (var k in milestone.specification.features) {
									var f = milestone.specification.features[k];
									f.estimatedEffort = mService.handleTimeConversion(f.estimatedEffort);
									f.estimatedUI     = mService.handleTimeConversion(f.estimatedUI);
									f.estimatedBE     = mService.handleTimeConversion(f.estimatedBE);
								}
								
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
					name     : milestone.name || ""
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
						date : m.format("dd DD.MM.YYYY"),
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
