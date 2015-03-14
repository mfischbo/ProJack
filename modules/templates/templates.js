ProJack.templates = angular.module("TemplateModule", ['Utils', 'angularFileUpload']);
ProJack.templates.config(['$routeProvider', function($routeProvider) {

    $routeProvider
        .when('/admin/templates', {
            controller : 'TemplateIndexController',
            templateUrl : './modules/templates/views/index.html'
        });
}]);


ProJack.templates.directive("templateSelector", ['TemplateService', function(service) {
	return {
		restrict : 		'A',
		scope : {
			'selectAs' : '=selectAs'
		},
		template : '<div class="form-group">'
			+ '<select data-ng-model="selectAs" data-ng-options="t as t.name for t in templates" class="form-control">'
			+ '</select>'
			+ '</div>',
			
		link : function(scope, element, attrs) {
			service.getAllTemplates().then(function(data) {
				scope.templates = data;
			});
		}
	};
}]);