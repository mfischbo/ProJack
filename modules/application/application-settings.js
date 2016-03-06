ProJack.app.controller('ApplicationSettingsController', ['$scope', '$http', 'KT', 'IssueService', 'ESService', function($scope, $http, KT, issueService, esService) {

	
	$scope.elastic = {
			online : false
	};
	

	$http.get(ProJack.config.esUrl + '/_nodes').success(function() {
		$scope.elastic.online = true;
	}).error(function() {
		$scope.elastic.online = false;
	});
	

	$scope.createESIndex = function() {
		$http.get(ProJack.config.dbUrl + '/_design/issues/_view/index').then(function(response) {
			for (var i in response.data.rows) {
				var issue = response.data.rows[i].value;
				issue.customer = undefined;
			
				issue.dateCreated = KT.sanitizeDate(issue.dateCreated);
				issue.dateModified = KT.sanitizeDate(issue.dateModified);
				issue.resolveUntil = KT.sanitizeDate(issue.resolveUntil);
				esService.index(issue);
			}
		});
	};
}]);