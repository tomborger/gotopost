/**
 * Manifest service
 *
 * Handles storage, updating, modification, and retrieval of the post manifest.
 */
angular.module( 'g2p' ).service( 'Manifest', function( $rootScope ) {

	/**
	 * Return manifest.
	 */
	this.get = function() {
		console.log( 'returning manifest to application' );
		console.log( "here's a copy of the manifest:");
		console.log( _this.manifest );
		return _this.manifest;
	}

	/**
	 * Sync local data with remote.
	 */
	this._sync = function( localBuilt, localChanged, remoteBuilt, remoteChanged ) {

		console.log( 'syncing; no worries, we do this every load.' );

		if( ! remoteBuilt ) {
			console.log( 'no remote, canceling' );
			return false;
		}

		else if( ! localBuilt || localBuilt < remoteBuilt ) {
			console.log( 'need a new local manifest, syncing...');
			_this._syncManifest();
			return true;
		}

		else if( ! remoteChanged ) {
			console.log( "don't need a new manifest; remote not changed; canceling...")
			return false;
		}

		else if( ! localChanged || localChanged < remoteChanged) {
			console.log( "don't need a new manifest but we either don't have local change data or our local change data is out of date; syncing...")
			_this._syncChanges();
			return true;
		}

		else {
			console.log( "Don't need a new manifest, remote changed, but local is up to date. Cancelling..." );
		}

	}

	/**
	 * Sync manifest with remote. Also grabs and syncs changes since last build.
	 *
	 * Called by _sync()
	 */
	this._syncManifest = function() {

		console.log( "syncing manifest" );

		jQuery.post( 
			ajaxurl + '?g2p_get_manifest', 
			{ 
				action: 'g2p_get_manifest', 
				_wpnonce: g2pData.getManifestNonce 
			}, 
			function( data ) {

				var response = JSON.parse( data );

				var changelog = response.changelog;

				_this.manifest = response.manifest;
				_this.localBuilt = response.built;
				
				if( changelog ) {
					_this._applyChanges( changelog );
				}

				console.log( "Okay, we've applied changes. Here's the new manifest:" );
				console.log( _this.manifest );

				_this.localChanged = response.changed;

				$rootScope.$broadcast( 'manifestUpdated' );

				if( _this.hasLocalStorage ) {

					// Limit the properties included in the manifest JSON to the list of
					// fields managed by the application. This strips Angular's $$hashKey
					// property, which would otherwise cause a duplication error when the
					// manifest is retrieved from storage next page load.
					var mJSON = JSON.stringify( _this.manifest, g2pData.fields );

					localStorage.setItem( 'g2pManifest', mJSON );
					localStorage.setItem( 'g2pBuilt', _this.localBuilt );

					if( _this.localChanged ) {
						localStorage.setItem( 'g2pChanged', _this.localChanged );
					}

				}
			}
		);
	}

	/**
	 * Sync changes (not manifest) with remote.
	 *
	 * Called by _sync()
	 */
	this._syncChanges = function() {

		console.log( "syncing changes..." );

		jQuery.post(
			ajaxurl + '?getting_changelog', 
			{ 
				action: 'g2p_get_changelog', 
				_wpnonce: g2pData.getChangelogNonce
			}, 
			function( data ) {

				console.log( "Got changelog back from the server." );
				console.log( "Here's the raw response: " );
				console.log( data );

				var response = JSON.parse( data );
				var changelog = response.changelog;

				if( changelog ) {
					console.log( "Applying changes ... ");
					_this._applyChanges( changelog );
				}

				console.log( "Updated localchanged to " + response.changed );
				_this.localChanged = response.changed;

				console.log( "broadcasting manifestUpdated" );
				$rootScope.$broadcast( 'manifestUpdated' );

				if( _this.hasLocalStorage ) {

					// Limit the properties included in the manifest JSON to the list of
					// fields managed by the application. This strips Angular's $$hashKey
					// property, which would otherwise cause a duplication error when the
					// manifest is retrieved from storage next page load.
					console.log( 'stringifying' );
					var mJSON = JSON.stringify( _this.manifest, g2pData.fields );

					localStorage.setItem( 'g2pManifest', mJSON );

					if( _this.localChanged ) {
						console.log( 'setting local changed time' );
						localStorage.setItem( 'g2pChanged', _this.localChanged );
					}

				}
			}
		);
	}

	/**
	 * Apply post changes from changelog to manifest.
	 *
	 * Called by _sync()
	 */
	this._applyChanges = function( changelog ) {

		console.log( "We're in _applyChanges now" );
		if( changelog.length ) {

			console.log( "Changelog has length. Looping through changelog... " );
			for( var i = 0; i < changelog.length; i++ ) {

				if( _this.localChanged >= changelog[i]['change_id'] ){
					console.log( "We're skipping this outdated changelog entry:" );
					console.log( changelog[i]);
					continue;
				}

				console.log( "Not skipping this one; going to loop through manifest now..." )
				for( var n = 0; n < _this.manifest.length; n++ ) {
					if( parseInt( _this.manifest[n]['ID'] ) === parseInt( changelog[i]['post_id'] ) ) {
						console.log( "Match found for ID " + _this.manifest[n]['ID'] + "! Splicing.");
						_this.manifest.splice( n, 1 );
					}
				}

				if( 'delete' !== changelog[i]['action'] ) {
					console.log( "And now, pushing the changed post (ID " + changelog[i]['post_id'] + ") back into the manifest." );
					_this.manifest.push( changelog[i]['post_data'] );
				}

			}

		}

	}

	var _this = this;

	this.hasLocalStorage = 'undefined' !== typeof( window.localStorage );
	this.changelog = null;

	// Get local state
	if( this.hasLocalStorage ) {

		console.log( "Getting manifest from local storage ..." );
		var mStr = localStorage.getItem( 'g2pManifest' );
		if( ! mStr ) {
			console.log( "No manifest. Setting to null." );
			this.manifest = null;
		}
		else {
			try {
				var mObj = JSON.parse( mStr );
				if( mObj && typeof mObj === 'object' && mObj !== null ) {
					console.log( "Legit manifest found. Setting variable.");
					this.manifest = mObj;
				}
			} catch( e ) {
				console.log( "There was a manifest in localStorage but it's not an object or it's null. Setting to null.");
				this.manifest = null;
			}
		}

		// Return null if stored as empty string
		this.localBuilt = localStorage.getItem( 'g2pBuilt' ) || null;
		this.localChanged = localStorage.getItem( 'g2pChanged' ) || null;

	} 
	else {

		console.log( "There is no localStorage; we're getting manifest each time." );
		this.manifest = this.localBuilt = this.localChanged = null;

	}

	// Get remote state
	this.remoteBuilt = g2pData.built;
	this.remoteChanged = g2pData.changed;

	// Sync
	this._sync( this.localBuilt, this.localChanged, this.remoteBuilt, this.remoteChanged );

});