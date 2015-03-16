ProJack.milestones = angular.module('MileStonesModule', ['Utils', 'CustomersModule', 'IssuesModule', 'TemplateModule', 'ui.tinymce', 'nvd3']);
ProJack.milestones.config(['$routeProvider', function($routeProvider) {

    $routeProvider
        .when('/milestones', {
            controller : 'MileStonesController',
            templateUrl : './modules/milestones/views/index.html'
        })
        .when('/milestones/create', {
            controller : 'MileStonesCreateController',
            templateUrl : './modules/milestones/views/create.html'
        })
        .when('/milestones/:id/edit', {
            controller : 'MileStonesEditController',
            templateUrl : './modules/milestones/views/edit.html'
        })
        .when('/milestones/:id/printview/:tid', {
        	controller	:	'MileStonesPrintController',
        	templateUrl	:	'./modules/milestones/views/printview.html'
        })
        .when('/milestones/:id/analyze', {
            controller : 'MileStonesAnalyzeController',
            templateUrl : './modules/milestones/views/analyze.html'
        });
}]);


ProJack.milestones.directive('milestonePicker', ['$http', function($http) {
	
	return {
		restrict : 'A',
		scope : {
			ngModel : '=',
			showEmpty : '@',
			showAll   : '@'
		},
		templateUrl : './modules/milestones/views/milestone-picker.html', 
		link: function(scope, elem, attrs) {
			
			scope.milestones = [];
			
			$http.get(ProJack.config.dbUrl + '/_design/milestones/_list/slim/index').success(function(data) {
				scope.milestones = data.rows;
				if (scope.showEmpty == 'true')
					scope.milestones.push({ id : ProJack.config.lowId, customer : ' - ', name : "Ohne Milestone "});
				if (scope.showAll == 'true')
					scope.milestones.push({ id : ProJack.config.highId, customer : ' - ', name : 'Alle'});
				scope.ngModel = scope.milestones[scope.milestones.length -1];
			});
			
			scope.selectMilestone = function(milestone) {
				scope.ngModel = milestone;
			};
		}
	};
}]);