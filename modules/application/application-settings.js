ProJack.app.controller('ApplicationSettingsController', ['$scope', '$http', 'KT', 'IssueService', function($scope, $http, KT, issueService) {

	
	$scope.elastic = {
			online : false
	};
	
	$scope.java = {
			online : false
	};
	
	$scope.esParams = {
			type : 'couchdb',
			couchdb : {
				host : '192.168.1.146',
				port : 5984,
				db   : 'projack',
				filter : null,
				user   : '',
				password : '',
				script   : 'ctx._type = ctx.doc.type',
				ignore_attachments : true
			},
			index : {
				index : ProJack.config.esIndex,
				type  : 'pj',
				bulk_size : 100,
				bulk_timeout : "10ms"
			}
	};
	
	$http.get(ProJack.config.esEndpoint + '/_nodes').success(function() {
		$scope.elastic.online = true;
	}).error(function() {
		$scope.elastic.online = false;
	});
	
	$http.get(ProJack.config.serviceUrl + '/health').success(function(data) {
		$scope.java.online = (data.status == 'UP');
	});
	
	
	$scope.deleteESIndex = function() {
		KT.confirm("Soll der Elasticsearch Index wirklich entfernt werden?", function() {
			$http({
				method : 'DELETE',
				url    : ProJack.config.esEndpoint + '/_river/' + ProJack.config.esIndex
			}).success(function() {
				KT.alert("Index wurde erfolgreich entfernt");
			}).error(function() {
				KT.alert('Bein entfernen des Index ist ein Fehler aufgetreten', 'error');
			});
		});
	};
	
	$scope.createESIndex = function() {
		$http.put(ProJack.config.esEndpoint + '/_river/' + ProJack.config.esIndex + '/_meta', $scope.esParams)
			.success(function() {
				KT.alert("Elasticsearch index wurde erfolgreich angelegt");
			});
	};
}]);