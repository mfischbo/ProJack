ProJack.projects.controller('ProjectIndexController', ['$scope', 'ProjectService', 'KT', function($scope, service, KT) {

	service.getAllProjects().then(function(data) {
		$scope.projects = data;
	});
	
	$scope.deleteProject = function(project) {
		KT.confirm('Do you really want to delete the project?', function() {
			service.deleteProject(project).then(function(promise) {
				KT.remove('_id', project_id, $scope.projects);
				KT.alert('The project has been removed');
			});
		});
	}
}]);



ProJack.projects.controller('ProjectCreateController', ['$scope', 'ProjectService', 'KT', '$location', function($scope, service, KT, $location) {
	
	$scope.project = service.newProject();
	$scope.contact  = service.newContact();
	
	$scope.createContact = function() {
		$scope.contact = service.newContact();
	};
	
	$scope.addContact = function() {
		if ($scope.contact) {
			$scope.project.contacts.push($scope.contact);
			$scope.contact = undefined;
		}
	};
	
	$scope.editContact = function(c) {
		$scope.contact = c;
	};

	$scope.unfocusContact = function() {
		$scope.contact = undefined;
	};
	
	$scope.removeContact = function(c) {
		KT.remove('id', c.id, $scope.project.contacts);
		if ($scope.contact && $scope.contact.id == c.id) 
			$scope.contact = undefined;
	};
	
	$scope.saveProject = function() {
		service.saveProject($scope.project).then(function() {
			KT.alert('The project has been created');
			$location.path("/projects");
		});
	};
}]);



/**
 * Controller to edit a given project 
 */
ProJack.projects.controller('ProjectEditController', ['$scope', '$routeParams', 'ProjectService', 'KT', 'GitlabService',
                                                         function($scope, $routeParams, service, KT, glService) {

	$scope.contact = undefined;
	
	glService.getAllProjects().then(function(data) {
		$scope.projects = data;
	});
	
	service.getProjectById($routeParams.id).then(function(data) {
		$scope.project = data;
	});

	$scope.createContact = function() {
		$scope.contact = service.newContact();
	};
	
	$scope.addContact = function() {
		if ($scope.contact) {
			if (KT.indexOf('id', $scope.contact.id, $scope.project.contacts) == -1) {
				$scope.project.contacts.push($scope.contact);
			}
			$scope.contact = undefined;
		}
	};

	$scope.unfocusContact = function() {
		$scope.contact = undefined;
	};
	
	$scope.editContact = function(c) {
		$scope.contact = c;
	};
	
	$scope.removeContact = function(c) {
		KT.remove('id', c.id, $scope.project.contacts);
		if ($scope.contact && $scope.contact.id == c.id) 
			$scope.contact = undefined;
	};
	
	
	$scope.saveProject = function() {
		service.saveProject($scope.project).then(function(project) {
			$scope.project = project;
			KT.alert('Saved');
		});
	};
}]);



