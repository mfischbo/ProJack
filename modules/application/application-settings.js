ProJack.app.controller('ApplicationSettingsController', ['$scope', '$http', function($scope, $http) {

	
	$scope.elastic = {
			online : false
	};
	
	$scope.java = {
			online : false
	};
	
	$http.get(ProJack.config.esEndpoint + '/_nodes').success(function() {
		$scope.elastic.online = true;
	}).error(function() {
		$scope.elastic.online = false;
	});
	
	$http.get(ProJack.config.serviceUrl + '/health').success(function(data) {
		$scope.java.online = (data.status == 'UP');
	});
}]);