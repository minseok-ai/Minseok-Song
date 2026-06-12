import sys
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'Pillow'])
    from PIL import Image

img_path = r'C:\Projects\Minseok Song\public\A1Firm.png'
out_path = r'C:\Projects\Minseok Song\public\A1Firm_light.png'

img = Image.open(img_path).convert('RGBA')
data = img.getdata()

new_data = []
for item in data:
    r, g, b, a = item
    if a > 0:
        # Convert white/light parts to dark
        if r > 220 and g > 220 and b > 220:
            new_data.append((40, 40, 40, a))
        else:
            # Darken the other colors (blue parts)
            new_data.append((int(r * 0.4), int(g * 0.4), int(b * 0.4), a))
    else:
        new_data.append(item)

img.putdata(new_data)
img.save(out_path)
print('Saved to', out_path)
