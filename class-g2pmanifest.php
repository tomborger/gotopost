<?php

/**
 * Manages creation and maintenance of the post manifest.
 *
 * @since 0.0.1
 */
class G2PManifest {

	/**
	 * How long to sleep between passes when building manifest.
	 *
	 * @since 0.0.1
	 */
	private $sleep;


	/**
	 * The batch size for iterating through posts.
	 *
	 * @since 0.0.1
	 */
	private $batch;


	/**
	 * The location of the manifest file.
	 *
	 * @since 0.0.1
	 * @access private
	 */
	private $filename;


	/**
	 * The fields from the posts table to be included in the manifest.
	 *
	 * @since 0.0.1
	 * @access private
	 */
	private $fields;


	/**
	 * Changelog to track post updates between manifest builds.
	 *
	 * @since 0.0.1
	 * @access private
	 */
	private $changelog;


	/**
	 * Build manifest. Runs in the background.
	 *
	 * @since 0.0.1
	 */
	function build() {

		set_time_limit(0);

		global $wpdb;

		$progress = 0;

		$timestamp = time();
		update_option( 'g2p_building_manifest', $timestamp );

		$last_id = $wpdb->get_var( "SELECT MAX(ID) FROM $wpdb->posts" );

		// Inflate last_id by our batch amount + 1, so we iterate through last post
		$last_id += ( $this->batch + 1 );

		// Arbitrarily inflate last ID to compensate for posts added during build
		$last_id += 50;

		$tmp = fopen( $this->filename . '.' . $timestamp, 'w' );
		fwrite( $tmp, '[' );

		for( $id = 0; $id <= $last_id; $id += $this->batch ) {

			$batch_start_id = $id;
			$batch_pause_id = $id + $this->batch;

			$fields = implode( ',', $this->fields );

			$posts = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT $fields
					 FROM $wpdb->posts 
					 WHERE ID >= %d 
					 AND ID < %d 
					 AND post_status != 'auto-draft'
					 AND post_status != 'trash'
					 AND post_type != 'revision'",
					$batch_start_id,
					$batch_pause_id
				)
			);

			foreach( $posts as $post ) {

				$post_json = json_encode( $post );
				fwrite( $tmp, $post_json . ',' );

			}

			$progress = min( round( ( $batch_pause_id / $last_id * 100 ), 1), 100 );

			update_option( 'g2p_build_progress', $progress . '%' );

			sleep( $this->sleep );

		}

		$props = fstat( $tmp );
		ftruncate( $tmp, $props[ 'size' ] - 1 );
		fseek( $tmp, 0, SEEK_END );
		fwrite( $tmp, ']' );

		fclose( $tmp );

		rename( $this->filename . '.' . $timestamp, $this->filename );

		update_option( 'g2p_building_manifest', false );
		update_option( 'g2p_manifest_built', $timestamp );

		update_option( 'g2p_changelog', get_option( 'g2p_temporary_changelog' ) );
		
		$this->changelog->reset_to( $timestamp );

	}


	/**
	 * Add WP-Cron job to rebuild manifest.
	 *
	 * @since 0.0.1
	 */
	function schedule() {

		if( ! wp_next_scheduled( 'g2p_cron_build_manifest' ) ) {
			wp_schedule_event( time(), 'daily', 'g2p_cron_build_manifest' );
		}

	}


	/**
	 * Manually trigger a manifest rebuild (AJAX callback).
	 * 
	 * @since 0.0.1
	 */
	function trigger() {
		
		$trigger_url = site_url( '?g2p_trigger_build_manifest' );
    wp_remote_post( $trigger_url, array( 'timeout' => 0.01, 'blocking' => false, 'sslverify' => apply_filters( 'https_local_ssl_verify', true ) ) );
		die;

	}


	/**
	 * Check on init for manifest rebuild request.
	 *
	 * @since 0.0.1
	 */
	function check_for_trigger() {

		if( isset( $_GET['g2p_trigger_build_manifest'] ) ) {

			$this->build();

		}

	}
	

	/**
	 * Report on manifest build progress (AJAX callback).
	 *
	 * @since 0.0.1
	 */
	function report() {

		if( '100%' == get_option( 'g2p_build_progress' ) && ! get_option( 'g2p_building_manifest' ) ) {
			echo "complete";
		} else {
			echo get_option( 'g2p_build_progress' );
		}

		die;

	}


	/**
	 * Return manifest to browser.
	 *
	 * @since 0.0.1
	 */
	function send() {

		check_admin_referer( 'getManifest' );

		ob_start( 'ob_gzhandler' );

		echo "{";

		echo "\"built\": " . get_option( 'g2p_manifest_built', 'null' );

		echo ",";

		echo "\"changed\": " . get_option( 'g2p_manifest_changed', 'null' );

		echo ",";

		echo " \"changelog\": ";
		if( $changelog = json_encode( get_option( 'g2p_changelog' ) ) ) {
			echo $changelog;
		} else {
			echo "null";
		}

		echo ",";

		echo "\"manifest\": ";

		if( get_option( 'g2p_manifest_built' ) ) {
			readfile( $this->filename );
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
	 * @param int $sleep The number of seconds to sleep between batches.
	 * @param int $batch The number of posts to process at once. 
	 * @param array $fields The list of fields to include in the manifest.
	 */
	function __construct( $fields, $sleep = 0, $batch = 100 ) {

		// Set fields
		$this->fields = $fields;

		// Set sleep
		$this->sleep = $sleep;

		// Set batch
		$this->batch = $batch;

		// Set filename
		$this->filename = plugin_dir_path( __FILE__ ) . 'manifest.json';

		// Create changelog
		$this->changelog = new G2PChangelog( $fields );

		// Schedule WP-Cron job for building manifest and connect to build function
		add_action( 'init', array( $this, 'schedule' ) );
		add_action( 'g2p_cron_build_manifest', array( $this, 'build' ) );

		// AJAX callbacks for manually triggering manifest rebuild
		add_action( 'wp_ajax_g2p_trigger_build_manifest', array( $this, 'trigger' ) );
		add_action( 'init', array( $this, 'check_for_trigger' ) );
		add_action( 'wp_ajax_g2p_check_progress', array( $this, 'report' ) );

		// AJAX callback for sending manifest and changelog to browser
		add_action( 'wp_ajax_g2p_get_manifest', array( $this, 'send' ) );

	}

}