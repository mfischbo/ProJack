ProJack.gitlab = angular.module('GitlabModule', []);
ProJack.gitlab.service('GitlabService', ['$http', '$q', function($http, $q) {

	return {
	
		getAllProjects : function() {
			return $http.get(ProJack.config.gitlabUrl + "/projects?per_page=100&private_token=" + ProJack.config.gitlabToken)
				.then(function(response) {
					return response.data;
				});
		},
		
		getBranchesByProjectId : function(id) {
			return $http.get(ProJack.config.gitlabUrl + '/projects/'+id+'/repository/branches?private_token=' + ProJack.config.gitlabToken)
				.then(function(response) {
					return response.data;
				});
		}
	};
}]);