import shutil
import glob
import os

src_dir = "/home/ajay/.gemini/antigravity/brain/78b02e4f-eab2-43b7-b50a-cd47c67ba3a7"
dest_dir = "/home/ajay/.gemini/antigravity/scratch/ka16-linen-club/img"

# Ensure destination exists
os.makedirs(dest_dir, exist_ok=True)

# Find all PNG files in source directory
png_files = glob.glob(os.path.join(src_dir, "*.png"))

print(f"Found {len(png_files)} PNG files to copy.")

for file_path in png_files:
    filename = os.path.basename(file_path)
    dest_path = os.path.join(dest_dir, filename)
    shutil.copy(file_path, dest_path)
    print(f"Copied: {filename}")

# Copy the real storefront background image
storefront_src = "/home/ajay/.gemini/antigravity/brain/db9f6e85-596a-4cfb-9024-131aaed4e29b/media__1779808479633.jpg"
storefront_dest = os.path.join(dest_dir, "storefront.jpg")
if os.path.exists(storefront_src):
    shutil.copy(storefront_src, storefront_dest)
    print("Copied real storefront background photo successfully.")

# Copy the newly uploaded New Arrivals beige linen model background image
new_arrivals_src = "/home/ajay/.gemini/antigravity/brain/db9f6e85-596a-4cfb-9024-131aaed4e29b/media__1779810096596.jpg"
new_arrivals_dest = os.path.join(dest_dir, "arrivals_banner.jpg")
if os.path.exists(new_arrivals_src):
    shutil.copy(new_arrivals_src, new_arrivals_dest)
    print("Copied real newly uploaded new arrivals banner photo successfully.")

# Copy the newly uploaded Offers background banner image
offers_src = "/home/ajay/.gemini/antigravity/brain/ef647075-80c2-4d2f-bca4-6c951d6f7ec1/media__1779718678371.jpg"
offers_dest = os.path.join(dest_dir, "offers_banner.jpg")
if os.path.exists(offers_src):
    shutil.copy(offers_src, offers_dest)
    print("Copied real newly uploaded offers banner photo successfully.")

# Copy the actual verified checked linen texture images
check1_src = "/home/ajay/.gemini/antigravity/brain/3a34799c-a32c-4468-aa0c-c0974659fd41/media__1779539717712.jpg"
check1_dest = os.path.join(dest_dir, "showroom-check-1.jpg")
if os.path.exists(check1_src):
    shutil.copy(check1_src, check1_dest)
    print("Copied real checked linen texture 1 successfully.")

check2_src = "/home/ajay/.gemini/antigravity/brain/3a34799c-a32c-4468-aa0c-c0974659fd41/media__1779539718639.jpg"
check2_dest = os.path.join(dest_dir, "showroom-check-2.jpg")
if os.path.exists(check2_src):
    shutil.copy(check2_src, check2_dest)
    print("Copied real checked linen texture 2 successfully.")

# Map user showroom photos to descriptive tags as well
src_showroom_shelves = os.path.join(src_dir, "media__1779462986304.jpg")
if os.path.exists(src_showroom_shelves):
    shutil.copy(src_showroom_shelves, os.path.join(dest_dir, "showroom-shelves.jpg"))
src_showroom_shirts = os.path.join(src_dir, "media__1779462986607.jpg")
if os.path.exists(src_showroom_shirts):
    shutil.copy(src_showroom_shirts, os.path.join(dest_dir, "showroom-shirts.jpg"))
src_showroom_mannequin = os.path.join(src_dir, "media__1779462986778.jpg")
if os.path.exists(src_showroom_mannequin):
    shutil.copy(src_showroom_mannequin, os.path.join(dest_dir, "showroom-mannequin.jpg"))
src_showroom_trousers = os.path.join(src_dir, "media__1779462986945.jpg")
if os.path.exists(src_showroom_trousers):
    shutil.copy(src_showroom_trousers, os.path.join(dest_dir, "showroom-trousers.jpg"))
src_showroom_desk = os.path.join(src_dir, "media__1779462987755.jpg")
if os.path.exists(src_showroom_desk):
    shutil.copy(src_showroom_desk, os.path.join(dest_dir, "showroom-desk.jpg"))

# Copy the newly uploaded Boutique Ambience showroom photo
new_uploaded_src = "/home/ajay/.gemini/antigravity/brain/ef647075-80c2-4d2f-bca4-6c951d6f7ec1/media__1779684103537.jpg"
new_uploaded_dest = os.path.join(dest_dir, "showroom-interior.jpg")
if os.path.exists(new_uploaded_src):
    shutil.copy(new_uploaded_src, new_uploaded_dest)
    print("Copied real newly uploaded showroom interior photo successfully.")

# Create numeric aliases showroom-1 through showroom-8 to support any direct URL entry!
try:
    shutil.copy(os.path.join(dest_dir, "showroom-shelves.jpg"), os.path.join(dest_dir, "showroom-1.jpg"))
    shutil.copy(os.path.join(dest_dir, "showroom-shirts.jpg"), os.path.join(dest_dir, "showroom-2.jpg"))
    shutil.copy(os.path.join(dest_dir, "showroom-mannequin.jpg"), os.path.join(dest_dir, "showroom-3.jpg"))
    shutil.copy(os.path.join(dest_dir, "showroom-trousers.jpg"), os.path.join(dest_dir, "showroom-4.jpg"))
    shutil.copy(os.path.join(dest_dir, "showroom-desk.jpg"), os.path.join(dest_dir, "showroom-5.jpg"))
    shutil.copy(os.path.join(dest_dir, "showroom-check-1.jpg"), os.path.join(dest_dir, "showroom-6.jpg"))
    shutil.copy(os.path.join(dest_dir, "showroom-check-2.jpg"), os.path.join(dest_dir, "showroom-7.jpg"))
    shutil.copy(os.path.join(dest_dir, "showroom-interior.jpg"), os.path.join(dest_dir, "showroom-8.jpg"))
    print("Created numeric aliases showroom-1.jpg through showroom-8.jpg successfully.")
except Exception as e:
    print(f"Note on aliases: {e}")

print("All asset copies completed successfully.")
