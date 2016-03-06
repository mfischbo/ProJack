ProJack.app.controller('ApplicationSettingsController', ['$scope', '$http', 'KT', 'IssueService', 'ESService', function($scope, $http, KT, issueService, esService) {

	
	$scope.elastic = {
			online : false
	};
	
	$scope.esParams = {
			type : 'couchdb',
			couchdb : {
				host : '',
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
		$http.get(ProJack.config.dbUrl + '/_design/issues/_view/index').then(function(response) {
			for (var i in response.data.rows) {
				var issue = response.data.rows[i].value;
				issue.customer = undefined;
			
				issue.dateCreated = KT.sanitizeDate(issue.dateCreated);
				issue.dateModified = KT.sanitizeDate(issue.dateModified);
				issue.resolveUntil = KT.sanitizeDate(issue.resolveUntil);
				esService.index(issue);
			}
		});
	};
}]);