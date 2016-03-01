/**
 * Service class that handles all back-end communication for sprints
 */
ProJack.sprint.service('SprintService', ['$http', '$q', 'KT', 'SecurityService', 'IssueService', function($http, $q, KT, secService, iService) {
	return {
		newSprint : function() {
			return {
				type		: 'sprint',
				name		: '',
				version		: '',
				metadata	: '',
				dateCreated : new Date().getTime(),
				userCreated : secService.getCurrentUserName(),
				startsAt	: undefined,
				releaseAt	: undefined,
				lanes		: []
			};
		},
		
		newSwimlane : function(isDefaultLane) {
			return {
				id 				: KT.UUID(),		 
				title 			: 'Default Lane',
				isDefaultLane	: isDefaultLane,
				issues    		: [],
				uiStates 		: {} // contains user specific data about the ui state
			};
		},
		
		/**
		 * Returns a list of all sprints
		 */
		getAllSprints : function() {
			return $http.get(ProJack.config.dbUrl + '/_design/sprints/_view/index')
				.then(function(response) {
					var retval = new Array();
					for (var i in response.data.rows)
						retval.push(response.data.rows[i].value);
					return retval;
				});
		},
	
		/**
		 * Returns all sprints that have a future release date
		 */
		getSprintsStartingAt: function(date) {
			return $http.get(ProJack.config.dbUrl + "/_design/sprints/_view/byReleaseDate?startKey=" + date.getTime())
				.then(function(response) {
					var retval = new Array();
					for (var i in response.data.rows)
						retval.push(response.data.rows[i].value);
					return retval;
				});
		},
	
		/**
		 * Returns the sprint for the given id including all issues that come along with the sprint
		 */
		getSprintById : function(id) {
			var that = this;
			return $http.get(ProJack.config.dbUrl + '/_design/sprints/_view/fullsprint?start_key=["'+id+'", -1]&end_key=["'+id+'", 9999]&include_docs=true')
				.then(function(response) {
					var sprint = response.data.rows[0].doc;
					var issues = [];
					for (var i in response.data.rows) {
						if (i == 0) continue;
						
						issues.push(response.data.rows[i].doc);
					}
					return that.prepareSprint(sprint, issues);
				});
		},
		
	
		/**
		 * Merges all issues into the sprint data model
		 */
		prepareSprint : function(sprint, issues) {
			if (sprint.lanes == undefined || sprint.lanes.length == 0) {
				sprint.lanes = [];
				var defaultLane = this.newSwimlane(true);
				sprint.lanes.push(defaultLane);
			
				defaultLane.issues = issues;
				return sprint;
			}
		
			for (var l in sprint.lanes) {
				for (var i in sprint.lanes[l].issues) {
					var issue = KT.find('_id', sprint.lanes[l].issues[i]._id, issues);
					sprint.lanes[l].issues[i] = issue;
				}
			}
			return sprint;
		},
		
		
		/**
		 * Saves a sprint
		 */
		saveSprint : function(sprint) {
			var def = $q.defer();
			if (!sprint._id) {
				$http.post(ProJack.config.dbUrl, sprint)
					.success(function(response) {
						def.resolve(response.data);
					}).error(function() { def.reject(); });
			} else {
				// Since the UI model requires us to have the full issue graph stored in the
				// actual lanes, we're going to create a copy here and remove all issues
				// from the actual array
				var copy = angular.copy(sprint);
				for (var i in copy.lanes) {
					for (var q in copy.lanes[i].issues) {
						copy.lanes[i].issues[q] = {
								_id : copy.lanes[i].issues[q]._id
						};
					}
				}
				
				$http.put(ProJack.config.dbUrl + '/' + sprint._id, copy)
					.success(function(response) {
						sprint._rev = response.rev;
						def.resolve(sprint);
					}).error(function() { def.reject(); });
			}
			return def.promise;
		},
		
		pollChanges : function(sprint) {
			var def = $q.defer();
			$http.get(ProJack.config.dbUrl + "/_changes?view=bySprint&since=now&feed=longpoll&include_docs=true&filter=sprints/sprint&sprint=" + sprint._id)
				.success(function(data) {
					if (data.results.length == 0) {
						def.resolve({});
						return;
					}
					var retval = {
							newDoc : data.results[0].doc
					};
					
					// find the previous revision of the issue
					iService.getIssueRevisions(retval.newDoc).then(function(data) {
						var rev = data[1];
						iService.getIssueByIdAndRevision(retval.newDoc._id, rev).then(function(doc) {
							retval.oldDoc = doc;
							def.resolve(retval);
						});
					});
				}).error(function() {
					def.reject();
				});
			return def.promise;
		}
	};
}]);
