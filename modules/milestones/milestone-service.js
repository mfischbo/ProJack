/*
 * Service for managing milestones
 */
ProJack.milestones.service("MilestoneService", 
		['$http', '$q', 'KT', 'IssueService', 
		 function($http, $q, KT, iService) {
	
	return {
		
		/**
		 * Creates a new milestone and initializes it with sane values
		 */
		newMilestone: function() {
			return {
				type 				: 'milestone',
				customer 			: '',
				factor				: 1.6,
				rate				: 60.00,
				daysForPayment		: 14,
				estimatedDevelopmentTime  : 0,
				dateCreated 		: new Date().getTime(),
				dateModified 		: new Date().getTime(),
				name 				: '',
				description 		: '',
				version 			: '',
				plannedCompletionDate: undefined,
				plannedApprovalDate :  undefined,
				plannedReleaseDate 	:  undefined,
				actualReleaseDate 	:  undefined, 
				approvedBy			: '',
				certifiedBy			: '',
				status				: 'NEW', // NEW, APPROVAL_REQUESTED, APPROVED, CERTIFIED
				specification : {
					authors 	: [],
					dateCreated : new Date().getTime(),
					title 		: '',
					features 	: []
				}
			};
		},
	
		/**
		 * Creates a new feature with sane values 
		 */
		newFeature : function() {
			return {
				_id				: KT.UUID(),
				title  			: '',
				requirement 	: '',
				implementation 	: '',
				result 			: '',
				internalNote 	: '',
				estimatedEffort : 0,
				estimatedUI		: 0,
				estimatedBE		: 0,
				createIssue     : true,
				questions 		: []
			};
		},
	
		/**
		 * Creates a new question with sane values
		 */
		newQuestion : function() {
			return {
				question 	: '',
				answer   	: '',
				answeredBy 	: '',
				referencedQuestion : ''
			};
		},
	
		/**
		 * Returns a promise returning all milestones on success
		 */
		getAllMilestones : function() {
			var p = $http.get(ProJack.config.dbUrl + "/_design/milestones/_view/index")
				.then(function(response) {
					var retval = [];
					for (var i in response.data.rows) {
						retval.push(response.data.rows[i].value);
					}
					return retval;
				});
			return p;
		},
	
		/**
		 * Returns a promise returning all milestones for the given customer
		 */
		getMilestonesByCustomer : function(customer) {
			var p = $http.get(ProJack.config.dbUrl + '/_design/milestones/_view/byCustomer?key="'+customer._id+'"')
				.then(function(response) {
					var retval = [];
					for (var i in response.data.rows) {
						retval.push(response.data.rows[i].value);
					}
					return retval;
				});
			return p;
		},
	
		/**
		 * Returns a promise returning a milestone for the given id
		 * @param The id of the milestone to be returned
		 */
		getMilestoneById : function(id) {
			var p = $http.get(ProJack.config.dbUrl + "/" + id)
				.then(function(response) {
					var retval = response.data;
					retval.attachments = [];
					for (var i in retval._attachments) 
						retval.attachments.push({ name : i, type : retval._attachments[i]['content_type'], size : retval._attachments[i].length });
					
					return retval;
				});
			return p;
		},
	
		/**
		 * Returns a promise containing the data for a persisted milestone.
		 * Use this when you want to save a new milestone
		 */
		createMilestone : function(milestone) {
			var p = $http.post(ProJack.config.dbUrl, milestone)
				.then(function(response) {
					return response.data;
				});
			return p;
		},
	
		/**
		 * Returns a promise updating a already persisted milestone
		 */
		updateMilestone : function(milestone) {
			milestone.dateModified = new Date().getTime();
		
			var def = $q.defer();
			
			// update the milestone document
			$http.put(ProJack.config.dbUrl + "/" + milestone._id, milestone)
				.success(function(response) {
			
					// assign the returned value
					milestone._rev = response.rev;
					
					// collect all features into a hashmap
					var features = {};
					for (var k in milestone.specification.features)
						features[milestone.specification.features[k]._id] = milestone.specification.features[k];

					// collect issues into an array
					var issues = [];
					for (var k in milestone.specification.features) {
						var f = milestone.specification.features[k];
						
						if (f.createIssue && f.createIssue == true) {
							var i = iService.newIssue();
							i.title = f.title;
							i.description = "<b>Anforderung</b><br/>" + f.requirement + "<br/><br/><b>Umsetzung</b><br/>" + f.implementation;
							i.milestone = milestone._id;
							i.feature = f._id;
							i.customer = milestone.customer._id;
							i.issuetype = "FEATURE";
							i.resolveUntil = milestone.plannedReleaseDate,
							f.createIssue = false;
							issues.push(i);
						} else {
							issues.push(iService.getIssueByFeature(f));	
						}
					}
					
					issues.push(iService.getNextIssueNumber());
					
					// process all new and updated issues
					$q.all(issues).then(function(results) {
						var q = 0;
						var number = results.pop().nextNumber;
						for (var x in results) {
							
							// update issue texts of already inserted issued
							var issue = results[x];
							if (issue._id) {
								var f = features[issue.feature];
								issue.title        = f.title;
								issue.resolveUntil = milestone.plannedReleaseDate;
								issue.description  = '<b>Anforderung</b><br/>' + f.requirement + '<br/><br/><b>Umsetzung</b><br/>' + f.implementation;
							} else {
								issue.number = (q + number);
								q++;
							}
						}
						
						// since we might changed the state of a feature, do a bulk update
						results.push(milestone);
						$http.post(ProJack.config.dbUrl + '/_bulk_docs', { docs : results }).success(function(iResp) {
							var retval = KT.find('id', milestone._id, iResp);
							def.resolve(retval);
						}).error(function() {
							def.reject();
						});
					});
				}).error(function(response) {
					KT.alert('Beim speichern des Milestones ist ein Fehler aufgetreten', 'error');
				});
			return def.promise;
		},
	
		/**
		 * Returns a promise deleting a persisted milestone
		 */
		deleteMilestone : function(milestone) {
			var p = $http({
				method : 'DELETE',
				url    : ProJack.config.dbUrl + "/" + milestone._id + "?rev=" + milestone._rev
			});
			return p;
		},
	
		/**
		 * Adds a document attachment to the milestone
		 * @param The document to be attached
		 * @param The file to be attached as attachment
		 */
		addAttachment : function(milestone, file) {
			if (!milestone._attachments)
				milestone._attachments = {};
			
			milestone._attachments[file.name] = {};
			milestone._attachments[file.name]['content_type'] = file.type;
			milestone._attachments[file.name]['data'] = file.data;
			return $http.post(ProJack.config.dbUrl, milestone).then(function(response) {
				return response.data;
			});
		},
		
		
		/**
		 * Sends the milestone to the backend service in order to generate a report from it.
		 * @param milestone The milestone to be printed
		 * @param template The template to be used for printing the milestone
		 */
		printMilestone : function(milestone, template, type) {
			var def = $q.defer();
			var that = this;
			
			// download the template for the report
			$http({ 
				method : 'GET',
				url    : ProJack.config.dbUrl + "/" + template._id + "?attachments=true",
				headers : {'Accept' : 'application/json'}
			
			}).then(function(response) {
				var name = undefined;
				for (var i in response.data._attachments) {
					name = i;
					break;
				}
				var attachment = response.data._attachments[name];
				
				// download all issues for this milestone to get the issue numbers for the features
				iService.getIssuesByMilestone(milestone).then(function(issues) {
					
					milestone.totalTime = 0;
					for (var i in milestone.specification.features) {
						var f = milestone.specification.features[i];
						
						// find the appropriate issue
						var issue = KT.find('feature', f._id, issues);
						if (issue) {
							// assign the actual issue number
							f.issueId = issue.number;
						
							// calculate the total time for that issue and the total time for the milestone
							var x = that.calculateFeatureTime(milestone, f);
							f.featureTime = moment.duration(x, 'seconds').format("HH:mm");
							milestone.totalTime += x;
						}
						issue = undefined;
					}
					// format the milestone time to a string
					milestone.totalTime = moment.duration(milestone.totalTime, 'seconds').format("HH:mm");
					
					// create the report
					var post = {
							template : attachment.data,
							model    : JSON.stringify(milestone),
							filename : milestone.name + ".pdf"
					}
					$http.post(ProJack.config.serviceUrl + "/reports?type=" + type, post).success(function(data) {
						var meta = { ext : '.pdf', mimetype : 'application/pdf'};
			
						if (type == 'ODT') {
							meta = { ext : '.odt', mimetype : 'application/vnd.oasis.opendocument.text' };
						}
						that.addAttachment(milestone, { name : milestone.name + meta.ext, type : meta.mimetype, data : data }).then(function() {
							def.resolve();
						});
					});
				});
			});
			return def.promise;
		},
		
		/**
		 * Calculates the actual time for a feature given the milestones factor 
		 * and the estimated development time for the feature.
		 * All feature times are rounded up to a quarter of an hour
		 */
		calculateFeatureTime : function(milestone, feature) {
			var factor= milestone.factor;
			
			// time is stored as string 'HH:mm'
			var tmp = feature.estimatedEffort.split(":");
			var fTime = (parseInt(tmp[0]) * 3600) + parseInt(tmp[1]) * 60;
			
			// multiply by the milestones factor
			fTime = fTime * factor;
			
			// round up to the quarter of an hour
			var q = fTime % 3600;
			if (q > 0 && q < 15 * 60)
				q = 15*60;
			if (q > 15*60 && q < 30*60)
				q = 30*60;
			if (q > 30*60 && q < 45*60)
				q = 45*60;
			if (q > 45*60) 
				q = 3600;
		
			fTime = (Math.floor(fTime / 3600) * 3600) + q;
			return fTime;
		},
		
	
		getMilestoneBudget : function(milestone) {
			var a = { developmentTime : 0, totalTime : 0};
			if (milestone.specification.features && milestone.specification.features.length > 0) {
						
				// sum up times for all features
				for (var i in milestone.specification.features) {
					var q = milestone.specification.features[i].estimatedEffort.split(":");
					a.totalTime += this.calculateFeatureTime(milestone, milestone.specification.features[i]);
					a.developmentTime += (parseInt(q[0]) * 3600 + parseInt(q[1]) * 60);
				}
			} else {
				// calculate the times from the given estimated effort time of the milestone
				a.totalTime = Math.ceil(milestone.estimatedDevelopmentTime * milestone.factor) * 3600;
				a.developmentTime = milestone.estimatedDevelopmentTime * 3600;
			}
			a.budget = (milestone.rate) * (a.totalTime / 3600);
			return a;
		},
		
		getFeatureSum : function(milestone, backend) {
			var retval = 0;
			for (var i in milestone.specification.features) {
				if (backend) 
					retval += KT.timeToSecs(milestone.specification.features[i].estimatedBE || '00:00');
				if (backend == false)
					retval += KT.timeToSecs(milestone.specification.features[i].estimatedUI || '00:00');
				if (backend == undefined) 
					retval += KT.timeToSecs(milestone.specification.features[i].estimatedEffort || '00:00');
			}
			return retval;
		},
		
		/**
		 * Calculates the aggregation for the given milestone
		 * @param The milestone to calculate the aggregation for
		 */
		getAggregation	: function(milestone) {
			
			var def = $q.defer();
			var that = this;
			
			// load the stats for this milestone
			$http.get(ProJack.config.dbUrl + '/_design/issues/_view/milestoneStats?group=true&key="' + milestone._id + '"')
				.success(function(data) {
					var a = {
							developmentTime: 0,
							totalTime : 0,
							issuestats : {
								totalCount : 0,
								assignedCount : 0,
								totalTimeSpent : 0,
								totalTrend : 0
							}
					};
					if (data.rows[0]) {
						a.issues = data.rows[0].value;
					}
					
					for (var i in a.issues) {
						a.issuestats.totalCount += a.issues[i].count;
						a.issuestats.assignedCount += a.issues[i].assigned;
						a.issuestats.totalTimeSpent += a.issues[i].timeSpent;
						a.issues[i].timeSpent = moment.duration(a.issues[i].timeSpent, 'seconds').format("HH:mm");
					}
				
					var cashflow = that.getMilestoneBudget(milestone);
					
					a.budget    = cashflow.budget;
					a.totalTime = cashflow.totalTime;
					a.developmentTime = cashflow.developmentTime;
					a.issuestats.totalTrend = moment.duration(a.issuestats.totalTimeSpent - a.developmentTime, 'seconds').format("HH:mm");
					a.issuestats.totalTimeSpent = moment.duration(a.issuestats.totalTimeSpent, 'seconds').format("HH:mm");
					
					if (milestone.specification.features.length > 0)
						a.budgetPerFeature = a.budget / milestone.specification.features.length;
					else
						a.budgetPerFeature = 0;
					a.overhead  = moment.duration(a.totalTime - a.developmentTime, 'seconds').format("HH:mm");
					a.timePerFeature = moment.duration(a.totalTime / milestone.specification.features.length, 'seconds').format("HH:mm");
					a.developmentTime = moment.duration(a.developmentTime, 'seconds').format('HH:mm', { forceLength : true });
					a.totalTime = moment.duration(a.totalTime, 'seconds').format('hh:mm', { forceLength : true });
					
					if (milestone.plannedReleaseDate) {
						a.daysToGo = moment(milestone.plannedReleaseDate).diff(moment(), 'days');
					}
				
					def.resolve(a);				
				}).error(function() {
					def.reject();
				});
			return def.promise;
		}
	};
}]);
