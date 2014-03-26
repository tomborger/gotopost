/**
 * g2pMenu Directive
 *
 * Handles menu bar interaction.
 */
angular.module( 'g2p' ).directive( 'g2pMenu', function( $timeout ) {
	
	return {

		restrict: 'C',
		controller: function( $scope, $element, $attrs ) {

			$scope.selectType = function( index ) {
				$scope.$broadcast( 'type', 'index', index );
			}
			
		}

	}

});