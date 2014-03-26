<?php

/**
 * Catches and logs post changes in between manifest builds.
 *
 * @since 0.0.1
 */
class G2PChangelog {

	/**
	 * The fields from the posts table to be included in changelog.
	 *
	 * @since 0.0.1
	 * @access private
	 */
	private $fields;


	/**
	 * Add an entry to the changelog.
	 *
	 * @since 0.0.1
	 * @param string $action The type of entry: 'update' or 'delete'.
	 * @param int $post_id The ID of the post.
	 * @param int $transient_id Indicates that this record should be logged to a
	 * transient, and identifies the transient to log to.
	 */
	function log( $action, $post_id, $transient_id = 0 ) {

		$timestamp = time();

		$post = get_post( $post_id );

		if( 'auto-draft' == $post->post_status || 'revision' == $post->post_type ) {
			return;
		}

		if( $transient_id ) {
			$changelog = get_transient( 'g2p_changelog_' . $transient_id );
		} else {
			$changelog = get_option( 'g2p_changelog' );
		}

		if( ! $changelog ) {
			$changelog = array();
		}

		$post_data = array();
		foreach( $this->fields as $field ) {
			$post_data[ $field ] = $post->$field;
		}

		array_push( 
			$changelog, 
			array(
				'change_id' => $timestamp,
				'action' => $action,
				'post_id' => $post_id,
				'post_data' => $post_data,
			)
		);

		if( $transient_id ) {
			set_transient( 'g2p_changelog_' . $transient_id, $changelog, 60 * 60 * 6 );
		} else {
			update_option( 'g2p_changelog', $changelog );
		}

		update_option( 'g2p_manifest_changed', $timestamp );

	}


	/**
	 * Log a post change (includes status transitions).
	 *
	 * @since 0.0.1
	 * @param int $post_id The ID of the post being changed.
	 */
	function log_update( $post_id ) {

		// If manifest is being built, log to temporary changelog so changes
		// will be applied on top of new manifest.
		if( $transient_id = get_option( 'g2p_building_manifest' ) ) {
			$this->log( 'update', $post_id, $transient_id );
		}

		// If manifest does not exist and is not being built, do nothing.
		if( ! get_option( 'g2p_manifest_built' ) ) {
			return;
		}

		$this->log( 'update', $post_id );

	}


	/**
	 * Log a post deletion.
	 *
	 * @since 0.0.1
	 * @param int $post_id The ID of the post being changed.
	 */
	function log_deletion( $post_id ) {

		// If manifest is being built, log to temporary changelog so changes
		// will be applied on top of new manifest.
		if( $transient_id = get_option( 'g2p_building_manifest' ) ) {
			$this->log( 'delete', $post_id, $transient_id );
		}

		// If manifest does not exist and is not being built, do nothing.
		if( ! get_option( 'g2p_manifest_built' ) ) {
			return;
		}

		$this->log( 'delete', $post_id );
		
	}


	/**
	 * Reset the changelog after manifest rebuild and add changes that occurred
	 * during build process. 
	 *
	 * @since 0.0.1
	 * @param int $transient_id Identifies the transient to grab changes from.
	 */
	function reset_to( $transient_id ) {

		update_option( 'g2p_changelog', get_transient( 'g2p_changelog_' . $transient_id ) );

	}


	/**
	 * Send changelog to browser.
	 *
	 * @since 0.0.1
	 */
	function send() {

		check_admin_referer( 'getChangelog' );

		ob_start( 'ob_gzhandler' );

		echo "{";

		echo "\"changed\": " . get_option( 'g2p_manifest_changed', 'null' );

		echo ",";

		echo "\"changelog\": ";
		if( $changelog = json_encode( get_option( 'g2p_changelog' ) ) ) {
			echo $changelog;
		} else {
			echo "null";
		}

		echo "}";

		die;

	}
	

	/**
	 * Initialize object.
	 *
	 * @since 0.0.1
	 * @param array $fields The list of fields to include in the changelog.
	 */
	function __construct( $fields ) {

		// Set fields
		$this->fields = $fields;

		// Catch and log post changes
		add_action( 'save_post', array( $this, 'log_update' ) );
		add_action( 'edit_attachment', array( $this, 'log_update' ) );
		add_action( 'add_attachment', array( $this, 'log_update' ) );
		add_action( 'delete_post', array( $this, 'log_deletion' ) );

		// AJAX callback for sending changelog to browser
		add_action( 'wp_ajax_g2p_get_changelog', array( $this, 'send' ) );

	}
}