/**
 * Focus service
 *
 * Tracks element focus in both app and document to facilitate easy switching.
 */
angular.module( 'g2p' ).service( 'Focus', function() {

	/**
	 * The last focused element in the app.
	 */
	this.g2p = null;

	/**
	 * The last focused element in the document.
	 */
	this.doc = null;

	/**
	 * Setter.
	 */
	this.set = function( target, type, data ) {

		this[ target ] = {
			type: type,
			data: data
		}

	}

	/**
	 * Unsetter.
	 */
	this.unset = function( target ) {
		this[ target ] = null;
	}

	/**
	 * Move focus from document to last focused element in app.
	 */
	this.toApp = function() {

		var $activeElement;

		// Shift to topmost window in case we're arriving from an iframe.
		top.focus();

		// Store document focus if not set previously (e.g. in TinyMCE)
		if( ! this.doc ) {

			// Focusing #wpbody-content causes window to jump on refocus
			$activeElement = 'wpbody-content' === document.activeElement.id ? jQuery( window ) : jQuery( document.activeElement );

			this.set( 'doc', 'jQuery', $activeElement );

		}

		if( ! this.g2p ) {
			this.set( 'g2p', 'jQuery', jQuery( '#g2p' ).find( 'input' ).first() );
		}

		switch( this.g2p.type ) {

			case 'jQuery':
				this.g2p.data.focus();
				break;

		}

		this.unset( 'g2p' );

	}

	/**
	 * Move focus from app to last focused element in document.
	 */
	this.toDoc = function() {

		this.set( 'g2p', 'jQuery', jQuery( document.activeElement ) );

		switch( this.doc.type ) {

			case 'tinyMCE':
				tinyMCE.execCommand( 'mceFocus', false, this.doc.data );
				break;

			case 'jQuery':
				this.doc.data.focus();
				break;

			default:
				jQuery( document ).focus();

		}

		this.unset( 'doc' );

	}

});