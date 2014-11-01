ProJack.templates.controller("TemplateIndexController", ['$scope', '$upload', 'TemplateService', 'KT', function($scope, $upload, service, KT) {

	$scope.template = service.newTemplate();
	
	service.getAllTemplates().then(function(data) {
		$scope.templates = data;
	});
	
	$scope.onTemplateSelect = function($file) {
		$scope.file = $file[0];
	};
	
	$scope.saveTemplate = function() {
		service.createTemplate($scope.template, $scope.file);
	};
	
	$scope.removeTemplate = function(t) {
		service.deleteTemplate(t).then(function() {
			KT.remove("_id", t._id, $scope.templates);
			KT.alert("Template wurde erfolgreich entfernt");
		});
	}
}]);


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