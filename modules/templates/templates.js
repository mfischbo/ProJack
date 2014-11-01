ProJack.templates = angular.module("TemplateModule", ['Utils', 'angularFileUpload']);

ProJack.templates.directive("templateSelector", ['TemplateService', 'KT', function(service, KT) {
	return {
		restrict : 		'A',
		scope : {
			'selectAs' : '=selectAs'
		},
		template : '<div class="form-group">'
			+ '<select data-ng-model="selectAs" data-ng-options="t._id as t.name for t in templates" class="form-control">'
			+ '</select>'
			+ '</div>',
			
		link : function(scope, element, attrs) {
			service.getAllTemplates().then(function(data) {
				scope.templates = data;
			})
		}
	};
}]);