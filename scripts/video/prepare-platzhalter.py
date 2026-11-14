from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
root=Path(__file__).resolve().parents[2]
p=root/'docs/helpcenter/video-source/platzhalter'; out=root/'apps/client/public/helpcenter/videos';out.mkdir(parents=True,exist_ok=True)
font='/System/Library/Fonts/Helvetica.ttc'
def f(n):return ImageFont.truetype(font,n)
scenes=[
 ('berlin',5,'Ein Design. Lokale Werte.','Ein Platzhalter wird passend zum Standort ersetzt.'),
 ('berlin',6,'Berlin: 3,90 €','Für dieses Gerät greift die Bedingungszeile Berlin.'),
 ('koeln',7,'Köln: 4,50 €','Dasselbe Design verwendet jetzt den Wert für Köln.'),
 ('standard',7,'Anderer Standort: 4,90 €','Ohne passende Bedingungszeile wird der Standardwert verwendet.'),
 ('standard',7,'Werte zentral pflegen','Im Design bleibt {{angebot.preis}} stehen. Der ausgegebene Wert variiert.')]
manifest=[]
for i,(key,duration,title,caption) in enumerate(scenes):
 im=Image.new('RGB',(1280,720),'#f5f4f9'); d=ImageDraw.Draw(im)
 d.rectangle((0,0,1280,95),fill='#28005a');d.text((48,25),'laightup',font=f(36),fill='#04d9d9');d.text((900,35),'HELPCENTER · KURZ ERKLÄRT',font=f(17),fill='#ddd3f0')
 d.text((48,123),title,font=f(36),fill='#211a35')
 shot=Image.open(p/(key+'.png')).convert('RGB');shot.thumbnail((1176,360),Image.Resampling.LANCZOS)
 # Enlarge the captured demo for legibility.
 shot=shot.resize((int(shot.width*min(1176/shot.width,360/shot.height)),int(shot.height*min(1176/shot.width,360/shot.height))),Image.Resampling.LANCZOS)
 im.paste(shot,((1280-shot.width)//2,200))
 d.rounded_rectangle((40,590,1240,675),radius=12,fill='#28005a');d.text((62,616),caption,font=f(25),fill='white')
 d.text((48,689),'Erklärdemo mit fiktiven Preisen · keine Aufnahme der Produktoberfläche',font=f(14),fill='#686377')
 scene=p/f'scene-{i}.png';im.save(scene);manifest.append({'path':str(scene),'seconds':duration})
(p/'scenes.json').write_text(json.dumps(manifest,indent=2)+'\n')
Image.open(p/'scene-0.png').save(out/'platzhalter-poster.jpg',quality=90)
# Keep only the usable source captures and the editorial scene definitions.
for key in ['berlin','koeln','standard']:
 for suffix in ['.jpg','-viewport.jpg']:
  (p/(key+suffix)).unlink(missing_ok=True)
print(sum(s['seconds'] for s in manifest),'seconds')
