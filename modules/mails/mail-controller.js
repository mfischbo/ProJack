ProJack.mails.controller("MailInboxController", ['$scope', 'KT', 'MailService', function($scope, KT, service) {

	$scope.accounts = [{
		name : "markus@socialmeta.de",
		login: "markus@socialmeta.de",
		password : "vj3KNjf3cU",
		host : "sslmailpool.ispgateway.de",
		messages: []
	}];
	
	$scope.messageCount = 0;
	$scope.panelVisible = false;
	
	$scope.getMessages = function(account) {
		service.getMessages(account.name, account.password, account.host, 'INBOX', 0, 5).then(function(messages) {
			for (var i in messages) {
				var m = messages[i];
				
				if (m.read == false && !KT.find('id', m.id, account.messages) && !sessionStorage.getItem(m.id)) {
					
					// find a suitable text part in that message
					for (var p in m.parts) {
						if (m.parts[p].contentType.indexOf('text/plain') > -1) {
							m.textContent = m.parts[p].content;
						}
					}
					
					account.messages.push(m);
					$scope.messageCount++;
				}
			}
		});
	};
	
	
	$scope.removeMessage = function(account, message) {
		if (!message.read)
			$scope.messageCount--;
		KT.remove('id', message.id, account.messages);
		sessionStorage.setItem(message.id, 'removed=true');
	};
	
	$scope.markAsRead = function(message) {
		if (!message.read)
			$scope.messageCount--;
		message.read = true;
	};
	
	for (var i in $scope.accounts) {
		window.setInterval(function() {
			$scope.getMessages($scope.accounts[i]);
		}, 60000);
		$scope.getMessages($scope.accounts[i]);
	}
	
	$scope.toggleVisible = function() {
		$scope.panelVisible = !$scope.panelVisible;
	};
}]);