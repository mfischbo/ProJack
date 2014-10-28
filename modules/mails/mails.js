ProJack.mails = angular.module("MailModule", []);
ProJack.mails.service("MailService", ['$http', '$q', 'KT', function($http, $q, KT) {

	return {
		
		getFolders : function(login, password, host) {
			KT.enableSpinner();
			return $http.get(ProJack.config.serviceUrl + "/mailbox/folders?login=" + login + "&password=" + password + "&host=" + host)
				.then(function(response) {
					KT.disableSpinner();
					return response.data;
				})
		},
		
		getMessages : function(login, password, host, folder, offset, length) {
			KT.enableSpinner();
			return $http.get(ProJack.config.serviceUrl + "/mailbox/messages/" + folder + "?login=" + login + "&password=" + password + "&host=" +host+ "&offset=" +offset+ "&length=" +length)
				.then(function(response) {
					KT.disableSpinner();
					return response.data;
				});
		}
	}
}]);


ProJack.mails.controller("MailboxIndexController", ['$scope', 'MailService', function($scope, service) {

	$scope.accounts = [{
		name : "markus@socialmeta.de",
		login: "markus@socialmeta.de",
		password : "vj3KNjf3cU",
		host : "sslmailpool.ispgateway.de",
		folders : []
	}];
	
	$scope.messages = [];
	$scope.currentFolder = "";

	for (var i in $scope.accounts) {
		var a = $scope.accounts[i];
		service.getFolders(a.name, a.password, a.host).then(function(data) {
			a.folders = data;
		})
	}
	
	$scope.getMessages = function(account, folder) {
		$scope.currentFolder = folder.name;
		service.getMessages(account.name, account.password, account.host, folder.fullname, 0, 30).then(function(messages) {
			$scope.messages = messages;
		});
	};
	
	$scope.focusMessage = function(message) {
		$scope.focusedMessage = message;
	};
}]);