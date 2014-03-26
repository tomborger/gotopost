/**
 * Preview service
 *
 * Fetches post previews from the server.
 */
angular.module( 'g2p' ).service( 'Preview', function( $rootScope, $timeout ) {

	var _this = this;

	/**
	 * The HTML that gets bound by the template.
	 */
	this.content = '';

	/**
	 * Cache of previewed posts
	 */
	this.previewCache = {};

	/**
	 * The promise of the current fetch $timeout. 
	 */
	this.nextFetch = null;

	/**
	 * Cancel previous $timeout if it hasn't executed and queue a new one.
	 */
	this.queue = function( postType, postID, postTitle ) {

		$timeout.cancel( _this.nextFetch );

		// Grab from cache if available
		if( _this.previewCache.hasOwnProperty( postID ) ) {

			_this.nextFetch = $timeout( function() {
				_this._updateContent( _this.previewCache[ postID ] );
			}, 200 );

			return;

		}

		_this.nextFetch = $timeout( function() {
			_this._fetch( postType, postID, postTitle );
		}, 200 );

	}

	/**
	 * Send request to server.
	 */
	this._fetch = function( postType, postID, postTitle ) {

		var action;

		if( 'attachment' === postType ) {
			action = 'g2p_get_attachment';
		}
		else {
			action = 'g2p_get_content';
		}

		jQuery.post( 
			ajaxurl + '?g2p_get_preview', 
			{ 
				action: action,
				post_id: postID,
				//_wpnonce: g2pData.getPreviewNonce 
			}, 
			function( response ) {
				
				var content, preview = JSON.parse( response );
				
				if( 'attachment' === preview.asset ) {
					content = "<div class='g2p-preview-attachment'><img src='" + preview.content + "' /></div>";
				} else {
					content = preview.content;
				}

				if( ! content ) { 
					content = "<p class='g2p-preview-notification'>(no content)</p>";
				}

				content = "<h2 class='g2p-preview-title'>" + postTitle + "</h2>" + content + "<div class='g2p-preview-shadow'></div>";

				_this.previewCache[ preview.post_id ] = content;

				_this._updateContent( content );

			}
		);
	
	}

	this._updateContent = function( content ) {

		if( _this.content === content ) {
			return;
		}
		else {

			$rootScope.$broadcast( 'previewChanging' );
			
			$timeout( function() {
				_this.content = content;
				$rootScope.$broadcast( 'previewChanged' );
			}, 110 );
			
		}

	}

	/**
	 * Reset to default HMTL.
	 */
	this.reset = function() {

		$timeout.cancel( _this.nextFetch );
		
		this.content = '';

	}

});
