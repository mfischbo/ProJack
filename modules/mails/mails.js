ProJack.mails = angular.module("MailModule", ['SecurityModule']);

ProJack.mails.filter('senderFormat', function() {
	return function(sender) {
		
		// remove quoted printable from addresses
		if (sender.indexOf('=?UTF-8') == 0) {
			sender = sender.replace(/=\?UTF-8\?.*=/gi, '');
		}
		
		var a = sender.substring(sender.lastIndexOf('<')+1, sender.lastIndexOf('>'));
		var n = sender.split('<')[0];
		n = n.replace(/"/g, '');
		n = n.trim();
		
		return n + ' (' + a + ')'; 
	}
});

ProJack.mails.filter('textFormat', ['$sce', function($sce) {
	return function(content) {
		content = content.replace(/\n/g, '<br/>');
		return $sce.trustAsHtml(content);
		
	};
}]);