ProJack.app = angular.module('ProJackPrinter', ['ngRoute', 'Utils', 'SecurityModule', 'TemplateModule', 'MileStonesModule', 'CustomersModule', 'IssuesModule']);
ProJack.app.config(['$routeProvider', function($routeProvider) {

	$routeProvider.when('/milestone/:id/:tid', {
		controller : 'PrintController',
		templateUrl: './modules/milestones/views/printview.html'
	});
}]);

ProJack.app.controller('PrintController', ['$scope', '$routeParams', '$sce', 'MilestoneService', 'TemplateService', function($scope, $routeParams, $sce, mService, tService) {

	$scope.milestone = undefined;
	$scope.template  = undefined;
	$scope.tUrl      = $sce.trustAsResourceUrl('');
	
	mService.getMilestoneById($routeParams.id).then(function(data) {
		$scope.milestone = data;
		
		tService.getTemplateById($routeParams.tid).then(function(tmpl) {
			$scope.template = tmpl;
			for (var q in $scope.template._attachments) {
				var url = ProJack.config.dbUrl + '/' + $scope.template._id + '/' + q;
				$scope.tUrl = $sce.trustAsResourceUrl(url);
				break;
			}
		});
	});
	
}]);