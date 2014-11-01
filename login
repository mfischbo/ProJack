<!DOCTYPE html>
<html data-ng-app="Login">
	<head>
		<title>ProJack - Project Management done right</title>
		<link rel="stylesheet" type="text/css" href="./resources/css/bootstrap.min.css">
		<link rel="stylesheet" type="text/css" href="./resources/css/font-awesome.min.css">
		<link rel="stylesheet" type="text/css" href="./resources/css/style.css">
	</head>
	
	<body>
		<div class="container">
			<div class="col-md-4" style="float:none; margin: 20% auto;" data-ng-view></div>
		</div>
	
		<script type="text/javascript">
			var ProJack = {};
		</script>
		<script type="text/javascript" src="./resources/js/jquery-2.1.1.min.js"></script>	
		<script type="text/javascript" src="./resources/js/bootstrap.min.js"></script>
		<script type="text/javascript" src="./resources/js/angular.min.js"></script>
		<script type="text/javascript" src="./resources/js/angular-route.min.js"></script>
		<script type="text/javascript" src="./resources/js/ui-bootstrap-tpls-0.11.2.min.js"></script>

		<!--  Angular Modules -->
		<script type="text/javascript" src="./modules/application/config.js"></script>
		<script type="text/javascript" src="./modules/application/utils.js"></script>
		<script type="text/javascript" src="./modules/security/security.js"></script>
		<script type="text/javascript" src="./modules/security/security-service.js"></script>
		<script type="text/javascript" src="./modules/application/login.js"></script>
	</body>
</html>