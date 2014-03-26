/**
 * g2pTypeSlider Directive
 *
 * Handles manipulation of the main app slider and broadcasts slide changes so
 * g2pCtrl can convert them into model updates.
 */
angular.module( 'g2p' ).directive( 'g2pTypeSlider', function( $timeout, $rootScope ) {

	return {

		restrict: 'C',
		controller: function( $scope, $element, $attrs ) {

			/**
			 * The Swiper controller.
			 */
			$scope.swiper;

			/**
			 * True if Swiper is swiping.
			 */
			$scope.isSwiping = false;

		},
		link: function( scope, elem, attrs ) {

			var _scope = scope;

			/**
			 * Initialize Swiper.
			 */
			$timeout( function() {

				scope.swiper = new Swiper( '.g2p-type-slider .swiper-container', {
					speed: 300,
					queueStartCallbacks: false,
					onSlideChangeStart: function( swiper ) {
						_scope.swiping = true;
						$rootScope.$broadcast( 'typeChanged', swiper.activeIndex ); 
					},
					onSlideChangeEnd: function( swiper ) {
						_scope.swiping = false;
						jQuery( '.g2p-type-slider .swiper-slide' ).eq( swiper.activeIndex ).find( 'input' ).focus();
					}
				});

			});

			/**
			 * Keyboard listeners
			 */
			Mousetrap.bindGlobal( 'meta+shift+.', function() {
				$rootScope.$broadcast( 'type', 'next' );
			});
			Mousetrap.bindGlobal( 'meta+shift+,', function() {
				$rootScope.$broadcast( 'type', 'previous' );
			});

			scope.$on( 'type', function( e, method, index ) {

				if( ! scope.visible ) {
					return;
				}

				switch( method ) {

					case 'next':
						if( scope.swiper.activeIndex === scope.swiper.slides.length - 1 ) {
							scope.swiper.swipeTo( 0 );
						} 
						else {
							// swiper.swipeNext() cannot queue multiple fast requests
							scope.swiper.swipeTo( scope.swiper.activeIndex + 1 );
						}
						break;

					case 'previous':
						if( scope.swiper.activeIndex === 0 ) {
							scope.swiper.swipeTo( scope.swiper.slides.length - 1 );
						} 
						else {
							// swiper.swipePrev() cannot queue multiple fast requests
							scope.swiper.swipeTo( scope.swiper.activeIndex - 1 );
						}
						break;

					case 'index':
						scope.swiper.swipeTo( index );
						break;

				}

			});

		}

	}

});