ProJack.templates.controller("TemplateIndexController", ['$scope', '$upload', 'TemplateService', 'KT', function($scope, $upload, service, KT) {

	$scope.template = service.newTemplate();
	
	service.getAllTemplates().then(function(data) {
		$scope.templates = data;
	});
	
	$scope.onTemplateSelect = function($file) {
		$scope.file = $file[0];
	};
	
	$scope.saveTemplate = function() {
		service.createTemplate($scope.template, $scope.file).then(function(data) {
			KT.alert("Das Template wurde hochgeladen");
			$scope.templates.push(data);
		});
	};
	
	$scope.removeTemplate = function(t) {
		service.deleteTemplate(t).then(function() {
			KT.remove("_id", t._id, $scope.templates);
			KT.alert("Template wurde erfolgreich entfernt");
		});
	};
}]);