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
			}
		},
		
		newSwimlane : function(isModifiable) {
			return {
				id 				: KT.UUID(),		 
				title 			: 'Default Lane',
				isModifieable	: isModifiable,
				issues    		: {
					unassigned  : [],
					processing  : [],
					qa			: [],
					done		: []
				},	// contains id's of all issues in this lane
				uiStates 		: {} // contains user specific data about the ui state
			};
		},
		
		/**
		 * Returns a list of all sprints
		 */
		getAllSprints : function() {
			return $http.get(ProJack.config.dbUrl + '/_design/sprints/_view/index')
				then(function(response) {
					var retval = [];
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
					var retval = [];
					for (var i in response.data.rows)
						retval.push(response.data.rows[i].value);
					return retval;
				});
		},
	
		/**
		 * Returns the sprint for the given id
		 */
		getSprintById : function(id) {
			return $http.get(ProJack.config.dbUrl + '/' + id)
				.then(function(response) {
					return response;
				});
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
				$http.put(ProJack.config.dbUrl + '/' + sprint._id, sprint)
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
					}
					
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
