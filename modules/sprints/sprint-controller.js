ProJack.sprint.controller('SprintIndexController', ['$scope', 'SprintService', function($scope, service) {
	
	$scope.sprint = [];
	service.getFutureSprints().then(function(data) {
		$scope.sprint = data[0];
	});
}]);

ProJack.sprint.controller('SprintCreateController', ['$scope', '$location', 'SprintService', 'KT', function($scope, $location, service, kt) {

	$scope.sprint = service.newSprint();
	
	$scope.saveSprint = function() {
		service.saveSprint($scope.sprint).then(function() {
			kt.alert("Der Sprint wurde angelegt");
			$location.path('/sprints');
		});
	};
}]);