ProJack.mails.controller("MailInboxController", ['$scope', 'KT', 'MailService', 'SecurityService', function($scope, KT, service, secService) {

	$scope.m = { mp : '' };
	$scope.persistPass = false;
	
	if (localStorage.getItem('__ProJack_mp')) {
		$scope.m.mp = localStorage.getItem('__ProJack_mp');
		$scope.persistPass = true;
	}
	
	secService.getCurrentUser().then(function(user) {
		$scope.accounts = user.mailAccounts;
		for (var i in $scope.accounts) {
			
			$scope.accounts[i].messages = [];
			console.log("Setting interval for account : " + $scope.accounts[i].name);
			window.setInterval(function() {
				$scope.getMessages($scope.accounts[i]);
			}, 60000);
			$scope.getMessages($scope.accounts[i]);
		}
	});
	
	
	$scope.messageCount = 0;
	$scope.panelVisible = false;
	
	$scope.getMessages = function(account) {
		if (!$scope.m.mp || $scope.m.mp.length == 0) {
			console.log('Missing masterpass. Skipping');
			return;
		}
		
		// decrypt the account password using the masterpass
		var pw = Aes.Ctr.decrypt(account.password, $scope.m.mp, 256);
		
		service.getMessages(account.name, pw, account.host, 'INBOX', 0, 5).then(function(messages) {
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
	
	
	$scope.toggleLSState = function() {
		$scope.persistPass = !$scope.persistPass;
		if ($scope.persistPass) {
			localStorage.setItem('__ProJack_mp', $scope.m.mp);
		} else {
			localStorage.removeItem('__ProJack_mp');
		}
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
	

	$scope.toggleVisible = function() {
		$scope.panelVisible = !$scope.panelVisible;
	};
}]);