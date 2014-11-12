ProJack.mails.controller("MailboxIndexController", ['$scope', 'MailService', function($scope, service) {

	$scope.accounts = [{
		name : "markus@socialmeta.de",
		login: "markus@socialmeta.de",
		password : "",
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