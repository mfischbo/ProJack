ProJack.reminder.controller('ReminderController', ['$scope', '$window', 'ReminderService', 'KT', function($scope, $window, service, KT) {

	$scope.panelVisible = false;
	
	$scope.reminder = service.newReminder();
	$scope.reminders = undefined;
	
	$scope.toggleVisible = function() {
		$scope.panelVisible = !$scope.panelVisible;
	};
	
	
	$scope.saveReminder = function() {
		if ($scope.reminder) {
			service.createReminder($scope.reminder).then(function() {
				KT.alert("Der Reminder wurde angelegt");
				$scope.reminder = service.newReminder();
			});
		}
	};
	
	$scope.fetchReminders = function() {
		service.getAllActiveReminders().then(function(reminders) {
			if ($scope.reminders && $scope.reminders.length < reminders.length) {
				$('#projack-player')[0].play();
			}
			$scope.reminders = reminders;
		});
	};
	
	$scope.removeReminder = function(reminder) {
		service.deleteReminder(reminder).then(function() {
			KT.remove('_id', reminder._id, $scope.reminders.reminders);
			KT.alert("Der Reminder wurde erfolgreich entfernt");
			$scope.reminders.length--;
		});
	};

	if (ProJack.config.reminderPollingEnabled) {
		// inititally load
		$scope.fetchReminders();
	
		// set a timeout
		$window.setInterval(function() {
			$scope.fetchReminders();
		}, ProJack.config.reminderPollTime);
	}
}]);