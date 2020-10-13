window.Assignment_Three_Scene = window.classes.Assignment_Three_Scene =
    class Assignment_Three_Scene extends Scene_Component {
        constructor(context, control_box)
        {
            // The scene begins by requesting the camera, shapes, and materials it will need.
            super(context, control_box);
            // First, include a secondary Scene that provides movement controls:
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 10, 20), Vec.of(0, 0, 0), Vec.of(0, 1, 0));
            // this.initial_camera_location = Mat4.inverse(context.globals.graphics_state.camera_transform);
            // For some reason, the "View solar system" button does not work correctly if we do not remove the inverse operation.
            this.initial_camera_location = context.globals.graphics_state.camera_transform;

            const r = context.width / context.height;
            context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

            const shapes = {
                torus: new Torus(15, 15),
                torus2: new (Torus.prototype.make_flat_shaded_version())(15, 15),
                sun : new Subdivision_Sphere(4),
                planet_1 : new (Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
                planet_2 : new Subdivision_Sphere(3),
                planet_3 : new Subdivision_Sphere(4),
                planet_4 : new Subdivision_Sphere(4),
                moon : new (Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
                planet_5 : new (Grid_Sphere.prototype.make_flat_shaded_version())(10, 10, 10)
            };
            this.submit_shapes(context, shapes);

            // Make some Material objects available to you:
            this.materials = {
                test: context.get_instance(Phong_Shader).material(Color.of(1, 1, 0, 1), {ambient: .2}),
                ring: context.get_instance(Ring_Shader).material(),
                sun : context.get_instance(Phong_Shader).material(Color.of(1, 0, 0, 1), {ambient: 1}),
                planet_1 : context.get_instance(Phong_Shader).material(Color.of(.753, .753, .753, 1)),
                planet_2 : context.get_instance(Phong_Shader).material(Color.of(.059, .408, .267, 1),
                                    { specularity: 1, diffusivity: .3 }),
                planet_3 : context.get_instance(Phong_Shader).material(Color.of(.784, .463, .024, 1),
                                    { specularity: 1, diffusivity: 1}),
                planet_4 : context.get_instance(Phong_Shader).material(Color.of(.000, .749, 1.00, 1),
                                    { specularity: 1}),
                moon : context.get_instance(Phong_Shader).material(Color.of(.000, .500, .000, 1),
                                    { specularity: 1}),
                rings : context.get_instance(Ring_Shader).material(Color.of(.784, .463, .024, 1)),
                planet_5 : context.get_instance(Phong_Shader).material(Color.of(.827, .827, .827, 1),
                                    { specularity: 1, diffusivity: 1})
            };

            this.lights = [new Light(Vec.of(5, -10, 5, 1), Color.of(0, 1, 1, 1), 1000)];
        }

        make_control_panel() {
            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
            this.key_triggered_button("View solar system", ["0"], () => this.attached = () => this.initial_camera_location);
            this.new_line();
            this.key_triggered_button("Attach to planet 1", ["1"], () => this.attached = () => this.planet_1);
            this.key_triggered_button("Attach to planet 2", ["2"], () => this.attached = () => this.planet_2);
            this.new_line();
            this.key_triggered_button("Attach to planet 3", ["3"], () => this.attached = () => this.planet_3);
            this.key_triggered_button("Attach to planet 4", ["4"], () => this.attached = () => this.planet_4);
            this.new_line();
            this.key_triggered_button("Attach to planet 5", ["5"], () => this.attached = () => this.planet_5);
            this.key_triggered_button("Attach to moon", ["m"], () => this.attached = () => this.moon);
        }

        display(graphics_state) {
            graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
            const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

            /* This speed will slow down after each planet. */
            let speed_multiplier = 1;
            const speed_delta = .1;

            /* Sun transformation matrix. */
            let sun_transform = Mat4.identity();

            /* Equation for periodic motion that goes from high to low over 5 seconds.
               To change to one period (i.e. high to low to high) over 5 seconds, change the (1/5) to (2/5).
               Range of the periodic function is [0, 1]. */
            const omega = (1/5) * Math.PI;
            const redness = (1/2) * Math.cos(omega * t) + (1/2);
            let sun_mat = this.materials.sun;
            sun_mat.color = Color.of(redness, 0, 1-redness, 1);

            /* The sun should be red at its largest (radius = 3), and blue at its smallest (radius = 1).
               Range of sun_scale is [1, 3]. */
            const sun_scale = Math.cos(omega * t) + 2;

            sun_transform = sun_transform.times(Mat4.scale([sun_scale, sun_scale, sun_scale]));

            /* Create a light inside the sun. */
            let sun_light = new Light(Vec.of(0, 0, 0, 1), Color.of(redness, 0, 1 - redness, 1), 10 ** sun_scale);
            graphics_state.lights = [sun_light];

            /* Draw the sun. */
            this.shapes.sun.draw(graphics_state, sun_transform, sun_mat);
            this.shapes.sun.draw(graphics_state, sun_transform, this.materials.sun);

            /* Draw the first planet. */
            let p1_transform = Mat4.identity().times(Mat4.rotation(t * speed_multiplier, Vec.of(0, 1, 0))) /* Rotate around sun.  */
                                              .times(Mat4.translation([5, 0, 0]))             /* Translate to orbit. */
                                              .times(Mat4.rotation(t, Vec.of(0, 1, 0)));      /* Rotate around self. */
            this.shapes.planet_1.draw(graphics_state, p1_transform, this.materials.planet_1);
            speed_multiplier -= speed_delta;
            this.planet_1 = Mat4.inverse(p1_transform.times(Mat4.translation([0, 0, 5])));

            /* Draw the second planet. */
            let p2_transform = Mat4.identity().times(Mat4.rotation(t * speed_multiplier, Vec.of(0, 1, 0)))
                                              .times(Mat4.translation([8, 0, 0]))
                                              //.times(Mat4.rotation(t, Vec.of(0, 1, 0)));
            let planet_2_mat = this.materials.planet_2;
            planet_2_mat.gouraud = (Math.floor(t) % 2 == 1);
            this.shapes.planet_2.draw(graphics_state, p2_transform, planet_2_mat);
            speed_multiplier -= speed_delta;
            this.planet_2 = Mat4.inverse(p2_transform.times(Mat4.translation([0, 0, 5])));

            /* Draw the third planet (including the ring/torus). */
            const haf_pi = Math.PI / 2;
            const qtr_pi = Math.PI / 4;
            let p3_transform = Mat4.identity().times(Mat4.rotation(t * speed_multiplier, Vec.of(0, 1, 0)))
                                              .times(Mat4.translation([11, 0, 0]))
                                              .times(Mat4.rotation(t, Vec.of(0, 1, 0)));
            let ring_transform = Mat4.identity().times(p3_transform)
                                                .times(Mat4.inverse(Mat4.rotation(t, Vec.of(0, 1, 0))))
                                                .times(Mat4.rotation(haf_pi, Vec.of(0, 1, 0)))
                                                .times(Mat4.rotation(haf_pi + qtr_pi * Math.cos(t), Vec.of(1, 0, 0)))
                                                .times(Mat4.scale([1, 1, .01]));
            this.shapes.planet_3.draw(graphics_state, p3_transform, this.materials.planet_3);
            this.shapes.torus.draw(graphics_state, ring_transform, this.materials.rings);
            speed_multiplier -= speed_delta;
            this.planet_3 = Mat4.inverse(p3_transform.times(Mat4.translation([0, 0, 5])));

            /* Draw the fourth planet and its moon. */
            let p4_transform = Mat4.identity().times(Mat4.rotation(t * speed_multiplier, Vec.of(0, 1, 0)))
                                              .times(Mat4.translation([14, 0, 0]))
                                              .times(Mat4.rotation(t, Vec.of(0, 1, 0)));
            let moon_transform = Mat4.identity().times(p4_transform)
                                                .times(Mat4.rotation(t * speed_multiplier, Vec.of(0, 1, 0)))
                                                .times(Mat4.translation([2.25, 0, 0]));
            this.shapes.planet_4.draw(graphics_state, p4_transform, this.materials.planet_4);
            this.shapes.moon.draw(graphics_state, moon_transform, this.materials.moon);
            speed_multiplier -= speed_delta;
            this.planet_4 = Mat4.inverse(p4_transform.times(Mat4.translation([0, 0, 5])));
            this.moon = Mat4.inverse(moon_transform.times(Mat4.translation([0, 0, 5])));

            /* Draw the fifth planet. */
            let p5_transform = Mat4.identity().times(Mat4.rotation(t * speed_multiplier, Vec.of(0, 1, 0)))
                                              .times(Mat4.translation([17, 0, 0]))
                                              .times(Mat4.rotation(t, Vec.of(0, 1, 0)));
            this.shapes.planet_5.draw(graphics_state, p5_transform, this.materials.planet_5);
            speed_multiplier -= speed_delta;
            this.planet_5 = Mat4.inverse(p5_transform.times(Mat4.translation([0, 0, 5])));

            /* Handle camera transformations. */
            if (this.attached) {
                graphics_state.camera_transform = this.attached().map((x, i) =>
                    Vec.from(graphics_state.camera_transform[i]).mix(x, .1));
            }
        }
    };

window.Ring_Shader = window.classes.Ring_Shader =
    class Ring_Shader extends Shader {
        // Subclasses of Shader each store and manage a complete GPU program.
        material() {
            // Materials here are minimal, without any settings.
            return {shader: this}
        }

        map_attribute_name_to_buffer_name(name) {
            // The shader will pull single entries out of the vertex arrays, by their data fields'
            // names.  Map those names onto the arrays we'll pull them from.  This determines
            // which kinds of Shapes this Shader is compatible with.  Thanks to this function,
            // Vertex buffers in the GPU can get their pointers matched up with pointers to
            // attribute names in the GPU.  Shapes and Shaders can still be compatible even
            // if some vertex data feilds are unused.
            return {object_space_pos: "positions"}[name];      // Use a simple lookup table.
        }

        // Define how to synchronize our JavaScript's variables to the GPU's:
        update_GPU(g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl) {
            const proj_camera = g_state.projection_transform.times(g_state.camera_transform);
            // Send our matrices to the shader programs:
            gl.uniformMatrix4fv(gpu.model_transform_loc, false, Mat.flatten_2D_to_1D(model_transform.transposed()));
            gl.uniformMatrix4fv(gpu.projection_camera_transform_loc, false, Mat.flatten_2D_to_1D(proj_camera.transposed()));
        }

        shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        {
            return `precision mediump float;
              varying vec4 position;
              varying vec4 center;
      `;
        }

        vertex_glsl_code()           // ********* VERTEX SHADER *********
        {
            return `
        attribute vec3 object_space_pos;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_transform;

        void main()
        {
            center = vec4(0, 0, 0, 1) * model_transform;
            position = vec4(object_space_pos, 1);
            gl_Position = projection_camera_transform * model_transform * position;
        }`;
        }

        fragment_glsl_code()           // ********* FRAGMENT SHADER *********
        {
            return `
        void main()
        {
            gl_FragColor = ceil(sin(25.0 * distance(center, position))) * vec4(.784, .463, .024, 1);
        }`;
        }
    };

window.Grid_Sphere = window.classes.Grid_Sphere =
    class Grid_Sphere extends Shape           // With lattitude / longitude divisions; this means singularities are at
    {
        constructor(rows, columns, texture_range)             // the mesh's top and bottom.  Subdivision_Sphere is a better alternative.
        {
            super("positions", "normals", "texture_coords");

            const torus_circle = Array(rows).fill(Vec.of(0, 0, 1)).map((x, i, a) =>
                                    Mat4.rotation(i / (a.length - 1) * Math.PI, Vec.of(0, -1, 0)).times(x));
   
            Surface_Of_Revolution.insert_transformed_copy_into(this, [rows, columns, torus_circle]);
        }
    };