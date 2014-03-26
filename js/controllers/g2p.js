/**
 * Main controller
 *
 * Manages visibility of the application.
 */
angular.module( 'g2p', ['ngSanitize'] ).controller( 'g2pCtrl', function( $scope, $timeout, $rootScope, Manifest, Focus, Preview ) {
	
	/**
	 * Stored manifest, retrieved immediately if available.
	 */
	$scope.manifest = Manifest.get();

	/**
	 * Is the viewport wide enough to support previews?
	 */
	$scope.previewEnabled = jQuery( window ).width() > 1024;

	/**
	 * Reference to preview service
	 */
	$scope.preview = Preview;

	/**
	 * List of supported post types from g2pData.
	 */
	$scope.types = g2pData.types;

	/**
	 * List of supported search fields from g2pData.
	 */
	$scope.searchFields = g2pData.searchFields;

	/**
	 * Current type.
	 */
	$scope.activeType = $scope.types[0].slug;

	/**
	 * State of application.
	 */
	$scope.visible = false;

	/**
	 * Toggle app visibility (i.e. route to open() or close() ).
	 */
	$scope.toggle = function() {
		if( $scope.visible ) {
			$scope.close();
		} else {
			$scope.open();
		}
	}

	/**
	 * Open the app and update focus.
	 */
	$scope.open = function() {

		if( $scope.visible ) {
			return;
		}

		$scope.visible = true;

		$rootScope.$broadcast( 'open' );

		jQuery( 'body' ).addClass( 'g2p-active' );

		$timeout( function() {
			Focus.toApp();
		});

	}

	/**
	 * Close the app and update focus.
	 */
	$scope.close = function() {

		if( ! $scope.visible ) {
			return;
		}

		$scope.visible = false;

		jQuery( 'body' ).removeClass( 'g2p-active' );

		$timeout( function() {
			Focus.toDoc();
		});

	}

	/**
	 *  Replace manifest with updated version when data is available.
	 */
	$scope.$on( 'manifestUpdated', function() {
		$scope.$apply( function() {
			$scope.manifest = Manifest.get();
		});
	});

	/**
	 * Handle type changes.
	 */
	$scope.$on( 'typeChanged', function( e, activeIndex ) {
		$scope.$apply( function() {
			$scope.activeType = $scope.types[ activeIndex ].slug;
		});
	});

	/**
	 * Handle preview changes.
	 * TODO: This should be in a preview directive.
	 */
	$scope.$on( 'previewChanging', function() {
		jQuery( '.g2p-preview' ).fadeOut( 100 );
	});
	$scope.$on( 'previewChanged', function() {
		jQuery( '.g2p-preview' ).fadeIn( 100 );
	});

	/**
	 * Keyboard listeners
	 *
	 * TODO: $timeout? Why? For tinyMCE? There are better ways.
	 */
	$timeout( function() {

		Mousetrap.bindGlobal( 'meta+shift+space', function() {
			$scope.$apply( function() {
				$scope.toggle();
			});
		});

		Mousetrap.bindGlobal( 'escape', function() {
			$scope.$apply( function() {
				$scope.close();
			});
		});

		if( 'object' === typeof( tinyMCE ) && tinyMCE.editors.length ){

			tinyMCE.editors[0].onKeyDown.add( function(ed, e) {

				if( e.shiftKey && 32 === e.keyCode ) {

					// Store focused field while still executing within iframe
					Focus.set( 'doc', 'tinyMCE', ed.id );

					$scope.open();

				}

			});

		}

	});

	jQuery( window ).on( 'resize', function() {

		var previewEnabled = ( jQuery( this ).width() > 1024 );
		
		$scope.$apply( function() {
			$scope.previewEnabled = previewEnabled;
		});

	});

});