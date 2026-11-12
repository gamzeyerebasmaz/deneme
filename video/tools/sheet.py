import sys, glob
from PIL import Image
d = sys.argv[1]; fs = sorted(glob.glob(d + '/f*.jpg')); ims = [Image.open(f) for f in fs]
w, h = ims[0].size; cols = int(sys.argv[2]) if len(sys.argv) > 2 else 3; rows = (len(ims) + cols - 1) // cols
sc = 2 if cols > 2 else 1
sheet = Image.new('RGB', (w * cols // sc, h * rows // sc))
for i, im in enumerate(ims): sheet.paste(im.resize((w // sc, h // sc)), ((i % cols) * w // sc, (i // cols) * h // sc))
sheet.save(d + '/sheet.jpg')
