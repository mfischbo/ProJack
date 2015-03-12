ProJack.sprint.service('SprintService', ['$http', '$q', 'SecurityService', function($http, $q, secService) {
	return {
		newSprint : function() {
			return {
				type		: 'sprint',
				name		: '',
				version		: '',
				dateCreated : new Date().getTime(),
				userCreated : secService.getCurrentUserName(),
				startsAt	: undefined,
				releaseAt	: undefined
			}
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
			return $http.get(ProJack.config.dbUrl + "/_design/sprints/_view/byReleaseDate?starKey=" + date.getTime())
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
		}
	};
}]);