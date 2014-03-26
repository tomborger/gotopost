/**
 * g2pType Directive
 *
 * Handles interaction with an individual post type slide and its post list.
 */
angular.module( 'g2p' ).directive( 'g2pType', function( $rootScope, $timeout, Preview ) {
	
	return {

		restrict: 'C',
		controller: function( $scope, $element, $attrs ) {

			/**
			 * The index of the active post relative to the result set.
			 */
			$scope.activeIndex = 0;

			/**
			 * The full post object of currently selected post.
			 */
			$scope.activePost = null;

			/**
			 * The ID of the currently selected post, used for $watch-ing.
			 */
			$scope.activeID = null;

			/**
			 * Set up page filter.
			 */
			$scope.currentPage = 0;
			$scope.itemsPerPage = 9;


			$scope.activatePost = function( e, index ) {
				if( $scope.resultSet[ index ].post_status === 'trash' ) {
					e.preventDefault();
					return;
				}
				$scope.activeIndex = index;
			}

			$scope.isActiveSlide = function() {
				if( ! $scope.visible ) {
					return false;
				}
				else if( $attrs.slug !== $scope.activeType ) {
					return false;
				}
				else {
					return true;
				}

			}

			$scope.updateActivePost = function() {
				$timeout( function() {
					$scope.activePost = $scope.resultSet.length ? $scope.resultSet[ $scope.activeIndex ] : null;
					$scope.activeID = $scope.activePost ? $scope.activePost.ID : null;
					$scope.preview();
				});
			}

			$scope.refresh = function() {
				$scope.activeIndex = 0;
				$scope.currentPage = 0;
				$scope.updateActivePost();
			}

			$scope.preview = function() {
				
				if( ! $scope.previewEnabled ) {
					return;
				}

				if( $scope.activePost ) {
					Preview.queue( $scope.activePost.post_type, $scope.activePost.ID, $scope.activePost.post_title );
				}
				else {
					Preview.reset();
				}

			}

		},
		link: function( scope, elem, attrs ) {

			/**
			 * Navigate post list
			 */
			Mousetrap.bindGlobal( 'up', function() {
				$rootScope.$broadcast( 'postChange', 'previous' );
			});
			Mousetrap.bindGlobal( 'shift+tab', function( e ) {
				$rootScope.$broadcast( 'postChange', 'previous', e );
			});
			Mousetrap.bindGlobal( 'down', function() {
				$rootScope.$broadcast( 'postChange', 'next' );
			});
			Mousetrap.bindGlobal( 'tab', function( e ) {
				$rootScope.$broadcast( 'postChange', 'next', e );
			})
			Mousetrap.bindGlobal( 'meta+shift+down', function() {
				$rootScope.$broadcast( 'pageChange', 'forward' );
			});
			Mousetrap.bindGlobal( 'meta+shift+up', function() {
				$rootScope.$broadcast( 'pageChange', 'backward' );
			});

			/**
			 * Go to currently active post
			 */
			Mousetrap.bindGlobal( 'enter', function() {
				$rootScope.$broadcast( 'goTo', 'active' );
			});

			/**
			 * Go to post by index in result set
			 */
			Mousetrap.bindGlobal( 'meta+shift+1', function() {
				$rootScope.$broadcast( 'goTo', 'index', 0 );
			});
			Mousetrap.bindGlobal( 'meta+shift+2', function() {
				$rootScope.$broadcast( 'goTo', 'index', 1 );
			});
			Mousetrap.bindGlobal( 'meta+shift+3', function() {
				$rootScope.$broadcast( 'goTo', 'index', 2 );
			});
			Mousetrap.bindGlobal( 'meta+shift+4', function() {
				$rootScope.$broadcast( 'goTo', 'index', 3 );
			});
			Mousetrap.bindGlobal( 'meta+shift+5', function() {
				$rootScope.$broadcast( 'goTo', 'index', 4 );
			});
			Mousetrap.bindGlobal( 'meta+shift+6', function() {
				$rootScope.$broadcast( 'goTo', 'index', 5 );
			});
			Mousetrap.bindGlobal( 'meta+shift+7', function() {
				$rootScope.$broadcast( 'goTo', 'index', 6 );
			});
			Mousetrap.bindGlobal( 'meta+shift+8', function() {
				$rootScope.$broadcast( 'goTo', 'index', 7 );
			});
			Mousetrap.bindGlobal( 'meta+shift+9', function() {
				$rootScope.$broadcast( 'goTo', 'index', 8 );
			});


			/**
			 * Navigate post list
			 */
			scope.$on( 'postChange', function( e, direction, orig_e ) {

				if( ! scope.isActiveSlide() ) {
					return;
				}

				if( orig_e ) {
					orig_e.preventDefault();
				}

				switch( direction ) {

					case 'next':
						if( 8 === scope.activeIndex || scope.activeIndex === ( scope.resultSet.length - 1 ) ) {
							scope.$apply( function() {
								scope.activeIndex = 0;
							});
							break;
						}
						scope.$apply( function() {
							scope.activeIndex++;
						});
						break;

					case 'previous':
						if( 0 === scope.activeIndex ) {
							scope.$apply( function() {
								scope.activeIndex = ( scope.resultSet.length - 1 );
							});
							break;
						}
						scope.$apply( function() {
							scope.activeIndex--;
						});
						break;

				}

				scope.updateActivePost();

			});
			// Refers to page of listings, not the page post type.
			scope.$on( 'pageChange', function( e, direction ) {

				if( ! scope.isActiveSlide() ) {
					return;
				}

				switch( direction ) {

					case 'backward':
						if( 0 === scope.currentPage ) {
							return;
						}
						scope.$apply( function() {
							scope.currentPage--;
						});
						break;

					case 'forward':
						if( ( ( scope.currentPage + 1 ) * scope.itemsPerPage ) >= ( scope.manifest.length ) ) {
							return;
						}
						scope.$apply( function() {
							scope.currentPage++;
						});
						break;

				}

				scope.updateActivePost();

			});


			/**
			 * Go to post!
			 */
			scope.$on( 'goTo', function( e, by, index ) {

				if( ! scope.isActiveSlide() ) {
					return;
				}

				switch( by ) {

					case 'index':
						if( index > ( scope.resultSet.length - 1 ) ) {
							return;
						}
						if( scope.resultSet[ index ].post_status === 'trash' ) {
							return;
						}

						scope.$apply( function() {
							scope.activeIndex = index;
						});

						window.location = 'post.php?post=' + scope.resultSet[ index ].ID + '&action=edit';
						break;

					case 'active':
						if( scope.resultSet[ scope.activeIndex ].post_status === 'trash' ) {
							return;
						}
						window.location = 'post.php?post=' + scope.resultSet[ scope.activeIndex ].ID + '&action=edit';
						break;
				}

			});


			/**
			 * Update active post when app is opened or when type slides into view
			 */
			scope.$on( 'open', function() {
				if( scope.isActiveSlide() ) {
					scope.updateActivePost();
				}
			});
			scope.$on( 'typeChanged', function() {
				if( scope.isActiveSlide() ) {
					scope.updateActivePost();
				}
			});

		}

	}

});