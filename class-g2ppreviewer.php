<?php

/**
 * Manages preview requests from the application.
 *
 * @since 0.0.1
 */
class G2PPreviewer {

	function send_content() {

		if( ! $_POST[ 'post_id' ] ) {
			die;
		}

		global $wpdb;
		$post_id = $_POST[ 'post_id' ];

		$content = $wpdb->get_var( 
			$wpdb->prepare(
				"SELECT post_content FROM $wpdb->posts WHERE ID = %d", 
				$post_id
			)
		);

		$content = $content ? $content : null;

		$return = array(
			'post_id' => $post_id,
			'asset' => 'content',
			'content' => $content,
		);

		echo json_encode( $return );

		die;

	}

	function send_attachment() {

		if( ! $_POST[ 'post_id' ] ) {
			die;
		}

		$post_id = $_POST[ 'post_id' ];

		$image = wp_get_attachment_image_src( $post_id, 'large', true );

		$url = $image[0];

		$return = array(
			'post_id' => $post_id,
			'asset' => 'attachment',
			'content' => $url,
		);

		echo json_encode( $return );

		die;

	}

	function __construct() {

		add_action( 'wp_ajax_g2p_get_content', array( $this, 'send_content' ) );
		add_action( 'wp_ajax_g2p_get_attachment', array( $this, 'send_attachment' ) );

	}

}
