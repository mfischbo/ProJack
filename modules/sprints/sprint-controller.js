/**
 * Controller for creating a new sprint 
 */
ProJack.sprint.controller('SprintCreateController', ['$scope', '$location', 'SprintService', 'KT', function($scope, $location, service, KT) {

	$scope.sprint = service.newSprint();
	$scope.tinymceOptions = ProJack.config.tinyOptions;
	
	$scope.saveSprint = function() {
		service.saveSprint($scope.sprint).then(function() {
			KT.alert("Der Sprint wurde angelegt");
			$location.path('/sprints');
		});
	};
}]);


/**
 * Controller for editing a given sprint
*/
ProJack.sprint.controller('SprintEditController', ['$scope', '$location', '$routeParams', 'SprintService', 'KT', function($scope, $location, $routeParams, service, KT) {

	$scope.tinymceOptions = ProJack.config.tinyOptions;
	
	service.getSprintById($routeParams.id).then(function(response) {
		$scope.sprint = response.data;
	});

	$scope.saveSprint= function() {
		service.saveSprint($scope.sprint).then(function() {
			KT.alert('Der Sprint wurde erfolgreich gespeichert');
			$location.path('/sprints');
		});
	};
}]);
