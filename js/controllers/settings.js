angular.module( 'g2p' ).controller( 'settingsCtrl', function( $scope ) {

	$scope.complete = false;

	$scope.buildManifest = function() {

		jQuery.post( ajaxurl, { action: 'g2p_trigger_build_manifest' }, function( data ) {

			$scope.reportProgress();

		});

	}

	$scope.reportProgress = function() {

		$scope.reportingTimeout = setInterval( function() {

			jQuery.post( ajaxurl, { action: 'g2p_check_progress' }, function( data ) {

				if( 'complete' == data ) {
					clearInterval( $scope.reportingTimeout );
					$scope.$apply( function() {
						$scope.complete = true;
					});

				}

			});

		}, 1000 );

	}

});