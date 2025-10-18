import matplotlib.pyplot as plt
import numpy as np
import tidy3d as td
import tidy3d.web as web


# "First, we define the shape of a spherical lens from a sphere with radius $R=60$ $\\mu m$. The lens is made of glass with refractive index $n=1.5$ at $\\lambda$=1 $\\mu m$. 
# The lens itself has a radius of 50 $\\mu m$."

lda0 = 1  # operation wavelength of the lens is 1 um
r = 50  # radius of the lens is set to 50 um
x = np.linspace(0, r, 1000)
R = 60  # radius of the corresponding sphere
n = 1.5  # index of refraction of glass
O = np.sqrt(R**2 - r**2)  # origin of the spherical lens
y_spherical = np.sqrt(R**2 - x**2) - O  # boundary of the spherical lens



h = lda0 / (n - 1)  # fresnel lens thickness
y_fresnel = y_spherical % h  # boundary of the fresnel lens
plt.plot(x, y_spherical, x, y_fresnel)
plt.xlabel(r"x ($\mu m$)")
plt.ylabel(r"z ($\mu m$)")
plt.legend(["Spherical lens", "Fresnel lens"])
plt.show()



H = h / 10  # fresnel lens discretization level
y_discretized = H * (y_fresnel // H)  # boundary of the discretized fresnel lens
plt.plot(x, y_discretized)
plt.legend(["Discretized Fresnel lens"])
plt.xlabel(r"x ($\mu m$)")
plt.ylabel(r"z ($\mu m$)")
plt.show()


air = td.Medium(permittivity=1)
glass = td.Medium(permittivity=n**2)

# create the fresnel lens by using cylinders
fresnel_lens = []
for i in range(len(y_discretized) - 1):
    if y_discretized[-i] != y_discretized[-i - 1]:
        if y_discretized[-i - 1] == 0:
            air_domain = td.Structure(
                geometry=td.Cylinder(
                    center=(0, 0, y_discretized[-i] / 2),
                    radius=x[-i],
                    length=y_discretized[-i],
                    axis=2,
                ),
                medium=air,
            )
            fresnel_lens.append(air_domain)
        lens_domain = td.Structure(
            geometry=td.Cylinder(
                center=(0, 0, y_discretized[-i - 1] / 2),
                radius=x[-i - 1],
                length=y_discretized[-i - 1],
                axis=2,
            ),
            medium=glass,
        )
        fresnel_lens.append(lens_domain)

# create a 0.5 um thick substrate
sub_thickness = 0.5
substrate = td.Structure(
    geometry=td.Cylinder(
        center=(0, 0, -sub_thickness / 2), radius=max(x), length=sub_thickness, axis=2
    ),
    medium=glass,
)
fresnel_lens.append(substrate)


freq0 = td.C_0 / lda0  # central frequency of the source
fwidth = freq0 / 10  # frequency width of the source

# define a plane wave source
source_z = 3  # z position of the source
pulse = td.GaussianPulse(freq0=freq0, fwidth=fwidth)
source = td.PlaneWave(
    size=(td.inf, td.inf, 0), center=(0, 0, source_z), source_time=pulse, direction="-"
)

# define a field monitor in the yz plane
field_monitor_yz = td.FieldMonitor(
    center=(0, 0, 0), size=(0, td.inf, td.inf), freqs=[freq0], name="field_yz"
)

# define a field monitor in the xz plane
field_monitor_xz = td.FieldMonitor(
    center=(0, 0, 0), size=(td.inf, 0, td.inf), freqs=[freq0], name="field_xz"
)






# define simulation domain size
buffer_xy = 2
Lz = 120
sim_size = (2 * r + buffer_xy, 2 * r + buffer_xy, Lz)

# define simulation run time
run_time = 1e-12

# define simulation
offset_z = 5
sim = td.Simulation(
    center=(0, 0, -Lz / 2 + offset_z),
    size=sim_size,
    grid_spec=td.GridSpec.auto(min_steps_per_wvl=15),
    sources=[source],
    monitors=[field_monitor_yz, field_monitor_xz],
    structures=fresnel_lens,
    run_time=run_time,
    boundary_spec=td.BoundarySpec.all_sides(boundary=td.PML()),
    symmetry=(-1, 1, 0),  # symmetry is applied to reduce the computational load
)

sim.plot_eps(y=0)
plt.show()





job = web.Job(simulation=sim, task_name="fresnel_lens")
estimated_cost = web.estimate_cost(job.task_id)


sim_data = job.run(path="data/simulation_data.hdf5")



fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))

sim_data.plot_field(
    field_monitor_name="field_xz", field_name="E", val="abs", vmin=0, vmax=6, ax=ax1
)
sim_data.plot_field(
    field_monitor_name="field_yz", field_name="E", val="abs", vmin=0, vmax=6, ax=ax2
)
plt.show()









focal_z = -102  # z position of the focal spot

# plot field intensity at the focus
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

sim_data.get_intensity(field_monitor_name="field_xz").sel(
    y=0, z=focal_z, f=freq0, method="nearest"
).plot(ax=ax1)
ax1.set_xlim([-10, 10])

sim_data.get_intensity(field_monitor_name="field_yz").sel(
    x=0, z=focal_z, f=freq0, method="nearest"
).plot(ax=ax2)
ax2.set_xlim([-10, 10])
plt.show()



Lz = 10  # new simulation domain size in z
offset_z = 4

pos_monitor_z = -5  # z position of the field projection monitor

# grids of the projected field position
xs_far = np.linspace(-30, 30, 301)
ys_far = np.linspace(-110, -10, 301)

# define a field projection monitor
monitor_proj = td.FieldProjectionCartesianMonitor(
    center=[0, 0, pos_monitor_z],
    size=[td.inf, td.inf, 0],
    freqs=[freq0],
    name="focal_plane_proj",
    proj_axis=0,  # axis along which to project, in this case x
    proj_distance=0,  # distance from this monitor to where fields are projected
    x=xs_far,
    y=ys_far,
    far_field_approx=False,
)

# define a new simulation by copying the previous simulation and updating the information
sim_new = sim.copy(
    update={
        "center": (0, 0, -Lz / 2 + offset_z),
        "size": (2 * r + buffer_xy, 2 * r + buffer_xy, Lz),
        "monitors": [monitor_proj],
    }
)
sim_new.plot_eps(y=0)
plt.show()


job = web.Job(simulation=sim_new, task_name="fresnel_lens_field_projection")
estimated_cost = web.estimate_cost(job.task_id)

print(f"The estimated maximum cost is {estimated_cost:.3f} Flex Credits.")

sim_data_new = job.run(path="data/simulation_data.hdf5")


proj_fields = sim_data_new["focal_plane_proj"].fields_cartesian.sel(f=freq0)

# compute norm of the field
E = np.sqrt(np.abs(proj_fields.Ex) ** 2 + np.abs(proj_fields.Ey) ** 2 + np.abs(proj_fields.Ez) ** 2)

# plot field distribution
E.plot(x="y", y="z", vmin=0, vmax=7, cmap="magma")
plt.show()




fig, ax = plt.subplots()

# plot field intensity at the focus from the exact simulation
sim_data.get_intensity(field_monitor_name="field_xz").sel(
    y=0, z=focal_z, f=freq0, method="nearest"
).plot(ax=ax)

# plot field intensity at the focus from the field projection
I = E**2
I.sel(z=focal_z - pos_monitor_z, method="nearest").plot(ax=ax)

# formatting the plot
ax.set_xlim([-10, 10])
ax.set_title("Field intensity comparison")
ax.set_ylabel("Field intensity")
ax.legend(("Exact simulation", "Field projection"))
plt.show()