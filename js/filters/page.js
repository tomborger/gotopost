/**
 * Page filter
 *
 * Returns results a page at a time.
 */
angular.module( 'g2p' ).filter( 'page', function() {

	return function( array, page, itemsPerPage ) {

		var offset = ( page ) * itemsPerPage;
		var end = offset + itemsPerPage;

		return array.slice( offset, end );

	}
});