fn main() {
    // Skills are embedded with include_dir!, so rebuild when any of them change.
    println!("cargo:rerun-if-changed=../skills");
    tauri_build::build()
}
