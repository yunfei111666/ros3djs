import THREE from '../../shims/three/core.js';
import * as ROSLIB from 'roslib';

import { Arrow } from '../models/Arrow'
import { SceneNode } from '../visualization/SceneNode'

/**
 * @author David V. Lu!! - davidvlu@gmail.com
 */

export class Pose extends THREE.Object3D {

  /**
   * A PoseStamped client
   *
   * @constructor
   * @param options - object with following keys:
   *
   *  * ros - the ROSLIB.Ros connection handle
   *  * topic - the marker topic to listen to
   *  * tfClient - the TF client handle to use
   *  * rootObject (optional) - the root object to add this marker to
   *  * color (optional) - color for line (default: 0xcc00ff)
   *  * length (optional) - the length of the arrow (default: 1.0)
   *  * headLength (optional) - the head length of the arrow (default: 0.2)
   *  * shaftDiameter (optional) - the shaft diameter of the arrow (default: 0.05)
   *  * headDiameter (optional) - the head diameter of the arrow (default: 0.1)
   */
  constructor(options) {
    super();
    this.options = options || {};
    this.ros = options.ros;
    this.topicName = options.topic || '/pose';
    this.tfClient = options.tfClient;
    this.color = options.color || 0xcc00ff;
    this.rootObject = options.rootObject || new THREE.Object3D();

    this.sn = null;

    this.rosTopic = undefined;
    this.subscribe();
  };


  unsubscribe(){
    if(this.rosTopic){
      this.rosTopic.unsubscribe(this.processMessage);
    }
  };

  subscribe(){
    this.unsubscribe();

    // subscribe to the topic
    this.rosTopic = new ROSLIB.Topic({
        ros : this.ros,
        name : this.topicName,
        queue_length : 1,
        messageType : 'geometry_msgs/PoseStamped'
    });
    this.rosTopic.subscribe(this.processMessage.bind(this));
  };

  processMessage(message){
    if(this.sn!==null){
        this.sn.unsubscribeTf();
        this.rootObject.remove(this.sn);
    }

    this.options.origin = new THREE.Vector3( message.pose.position.x, message.pose.position.y,
                                             message.pose.position.z);

    var rot = new THREE.Quaternion(message.pose.orientation.x, message.pose.orientation.y,
                                   message.pose.orientation.z, message.pose.orientation.w);
    this.options.direction = new THREE.Vector3(1,0,0);
    this.options.direction.applyQuaternion(rot);
    this.options.material = new THREE.MeshBasicMaterial({color: this.color});
    var arrow = new Arrow(this.options);

    this.sn = new SceneNode({
        frameID : message.header.frame_id,
        tfClient : this.tfClient,
        object : arrow
    });

    this.rootObject.add(this.sn);
  };
}