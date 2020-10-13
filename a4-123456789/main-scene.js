window.Assignment_Four_Scene = window.classes.Assignment_Four_Scene =
class Assignment_Four_Scene extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   ) 
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        const shapes = { box:   new Cube(),
                         box_2: new Cube(),
                         axis:  new Axis_Arrows(),
                         complex: new Complex_Shape()
                       }
        this.submit_shapes( context, shapes );

        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when 
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials =
          {
              phong: context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ) ),
              apu: context.get_instance(Texture_Rotate).material(Color.of(0, 0, 0, 1),
                  { ambient: 1, texture: context.get_instance("assets/apu.jpg", false)}),
              spurdo: context.get_instance(Texture_Scroll_X).material(Color.of(0, 0, 0, 1),
                  { ambient: 1, texture: context.get_instance("assets/spurdo.jpg", true)}),
              terz: context.get_instance(Texture_Rotate).material(Color.of(0, 0, 0, 1),
                  { ambient: 1, texture: context.get_instance("assets/terz.jpg", true)})
          }

        this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];

        // TODO:  Create any variables that needs to be remembered from frame to frame, such as for incremental movements over time.
          this.should_rotate = true;
          this.apu_box_rot_angle = 0;
          this.spurdo_box_rot_angle = 0;
      }
    make_control_panel()
      { // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
          this.key_triggered_button("Toggle Rotation", ["c"],
              () => this.should_rotate = !this.should_rotate );
      }
    display( graphics_state )
      { graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

        // TODO:  Draw the required boxes. Also update their stored matrices.

        if (this.should_rotate)
        {
            this.apu_box_rot_angle += dt * Math.PI;             // 30 rev/min === PI rad/s
            this.spurdo_box_rot_angle += dt * Math.PI * 2 / 3;  // 20 rev/min === 2/3 PI rad/s
        }

        this.shapes.box.draw(graphics_state, Mat4.identity()
            .times(Mat4.translation(Vec.of(-2, 0, 0)))
                .times(Mat4.rotation(this.apu_box_rot_angle, Vec.of(1, 0, 0))),
            this.materials.apu);

        this.shapes.box.draw(graphics_state, Mat4.identity()
            .times(Mat4.translation(Vec.of(2, 0, 0)))
                .times(Mat4.rotation(this.spurdo_box_rot_angle, Vec.of(0, 1, 0))),
            this.materials.spurdo);

        this.shapes.complex.draw(graphics_state, Mat4.identity()
            .times(Mat4.translation(Vec.of(0, -3, 0)))
                .times(Mat4.scale(Vec.of(.2, .2, .2))),
            this.materials.terz);
      }
  }
window.Complex_Shape = window.classes.Complex_Shape =
class Complex_Shape extends Shape
{
    constructor()
    {
        super("positions", "normals", "texture_coords");
        this.draw_letter_h(Vec.of(-3, 0, 0));
        this.draw_letter_i(Vec.of(3, 0, 0));
    }

    draw_letter_h(offset)
    {
        Cube.insert_transformed_copy_into(this, [], Mat4.identity()
            .times(Mat4.translation(offset))
            .times(Mat4.scale(Vec.of(3, 1, 1))));

        Cube.insert_transformed_copy_into(this, [], Mat4.identity()
            .times(Mat4.translation(offset))
            .times(Mat4.translation(Vec.of(2, 0, 0)))
            .times(Mat4.scale(Vec.of(1, 5, 1))));

        Cube.insert_transformed_copy_into(this, [], Mat4.identity()
            .times(Mat4.translation(offset))
            .times(Mat4.translation(Vec.of(-2, 0, 0)))
            .times(Mat4.scale(Vec.of(1, 5, 1))));
    }

    draw_letter_i(offset)
    {
        Cube.insert_transformed_copy_into(this, [], Mat4.identity()
            .times(Mat4.translation(offset))
            .times(Mat4.translation(Vec.of(0, -2, 0)))
            .times(Mat4.scale(Vec.of(1, 2, 1))));

        Subdivision_Sphere.insert_transformed_copy_into(this, [3], Mat4.identity()
            .times(Mat4.translation(offset))
            .times(Mat4.translation(Vec.of(0, 2, 0))));
    }
};

class Texture_Scroll_X extends Phong_Shader
{ fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {
      // TODO:  Modify the shader below (right now it's just the same fragment shader as Phong_Shader) for requirement #6.
      return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec2 trans_tex_coord = f_tex_coord * 2.;
          trans_tex_coord.x += 2. * mod(animation_time, 2.);
          vec4 tex_color = texture2D( texture, trans_tex_coord );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}

class Texture_Rotate extends Phong_Shader
{ fragment_glsl_code()           // ********* FRAGMENT SHADER ********* 
    {
      // TODO:  Modify the shader below (right now it's just the same fragment shader as Phong_Shader) for requirement #7.
      return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.

          vec2 new_tex = f_tex_coord;
          new_tex.x -= .5;
          new_tex.y -= .5;
          float ra = 1.570796326 * animation_time;
          mat2 rot_mat = mat2( cos(ra), sin(ra), -sin(ra), cos(ra) );
          new_tex = rot_mat * new_tex;
          new_tex.x += .5;
          new_tex.y += .5; 
          vec4 tex_color = texture2D( texture, new_tex );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
    }
}