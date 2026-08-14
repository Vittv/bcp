#!/usr/bin/env python3
"""Compare extracted traditional collects against authoritative Wikisource text."""
import json
import re

from paths import SCRATCH

AUTHORITATIVE = {
 "Fourth Sunday of Advent": "We beseech thee, Almighty God, to purify our consciences by thy daily visitation, that when thy Son our Lord cometh he may find in us a mansion prepared for himself; through the same Jesus Christ our Lord, who liveth and reigneth with thee, in the unity of the Holy Spirit, one God, now and for ever. Amen.",
 "Eighth Sunday after the Epiphany": "O most loving Father, who willest us to give thanks for all things, to dread nothing but the loss of thee, and to cast all our care on thee who carest for us: Preserve us from faithless fears and worldly anxieties, and grant that no clouds of this mortal life may hide from us the light of that love which is immortal, and which thou hast manifested unto us in thy Son Jesus Christ our Lord; who liveth and reigneth with thee, in the unity of the Holy Spirit, one God, now and for ever. Amen.",
 "Proper 4": "O God, whose never-failing providence ordereth all things both in heaven and earth: We humbly beseech thee to put away from us all hurtful things, and to give us those things which are profitable for us; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Proper 14": "Grant to us, Lord, we beseech thee, the spirit to think and do always such things as are right, that we, who cannot exist without thee, may by thee be enabled to live according to thy will; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Proper 25": "Almighty and everlasting God, give unto us the increase of faith, hope, and charity; and, that we may obtain that which thou dost promise, make us to love that which thou dost command; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Confession of Saint Peter": "Almighty Father, who didst inspire Simon Peter, first among the apostles, to confess Jesus as Messiah and Son of the living God: Keep thy Church steadfast upon the rock of this faith, that in unity and peace we may proclaim the one truth and follow the one Lord, our Savior Jesus Christ; who liveth and reigneth with thee and the Holy Spirit, one God, now and for ever. Amen.",
 "Holy Cross Day": "Almighty God, whose Son our Savior Jesus Christ was lifted high upon the cross that he might draw the whole world unto himself: Mercifully grant that we, who glory in the mystery of our redemption, may have grace to take up our cross and follow him; who liveth and reigneth with thee and the Holy Spirit, one God, in glory everlasting. Amen.",
 "Monday in Holy Week": "Almighty God, whose most dear Son went not up to joy but first he suffered pain, and entered not into glory before he was crucified: Mercifully grant that we, walking in the way of the cross, may find it none other than the way of life and peace; through the same thy Son Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Tuesday in Holy Week": "O God, who by the passion of thy blessed Son didst make an instrument of shameful death to be unto us the means of life: Grant us so to glory in the cross of Christ, that we may gladly suffer shame and loss for the sake of thy Son our Savior Jesus Christ; who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Wednesday in Holy Week": "O Lord God, whose blessed Son our Savior gave his back to the smiters and hid not his face from shame: Grant us grace to take joyfully the sufferings of the present time, in full assurance of the glory that shall be revealed; through the same thy Son Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Wednesday in Easter Week": "O God, whose blessed Son did manifest himself to his disciples in the breaking of bread: Open, we pray thee, the eyes of our faith, that we may behold him in all his redeeming work; through the same thy Son Jesus Christ our Lord, who liveth and reigneth with thee, in the unity of the Holy Spirit, one God, now and for ever. Amen.",
 "Saturday in Easter Week": "We thank thee, heavenly Father, for that thou hast delivered us from the dominion of sin and death and hast brought us into the kingdom of thy Son; and we pray thee that, as by his death he hath recalled us to life, so by his love he may raise us to joys eternal; who liveth and reigneth with thee, in the unity of the Holy Spirit, one God, now and for ever. Amen.",
 "Second Sunday after Christmas Day": "O God, who didst wonderfully create, and yet more wonderfully restore, the dignity of human nature: Grant that we may share the divine life of him who humbled himself to share our humanity, thy Son Jesus Christ; who liveth and reigneth with thee, in the unity of the Holy Spirit, one God, for ever and ever. Amen.",
 "The Epiphany": "O God, who by the leading of a star didst manifest thy only-begotten Son to the peoples of the earth: Lead us, who know thee now by faith, to thy presence, where we may behold thy glory face to face; through the same Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, now and for ever. Amen.",
 "Proper 24": "Almighty and everlasting God, who in Christ hast revealed thy glory among the nations: Preserve the works of thy mercy, that thy Church throughout the world may persevere with steadfast faith in the confession of thy Name; through the same Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Proper 26": "Almighty and merciful God, of whose only gift it cometh that thy faithful people do unto thee true and laudable service: Grant, we beseech thee, that we may run without stumbling to obtain thy heavenly promises; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, now and for ever. Amen.",
 "Proper 29": "Almighty and everlasting God, whose will it is to restore all things in thy well-beloved Son, the King of kings and Lord of lords: Mercifully grant that the peoples of the earth, divided and enslaved by sin, may be freed and brought together under his most gracious rule; who liveth and reigneth with thee and the Holy Spirit, one God, now and for ever. Amen.",
 "Saint Barnabas": "Grant, O God, that we may follow the example of thy faithful servant Barnabas, who, seeking not his own renown but the well-being of thy Church, gave generously of his life and substance for the relief of the poor and the spread of the Gospel; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Sunday of the Passion:  Palm Sunday": "Almighty and everlasting God, who, of thy tender love towards mankind, hast sent thy Son our Savior Jesus Christ to take upon him our flesh, and to suffer death upon the cross, that all mankind should follow the example of his great humility: Mercifully grant that we may both follow the example of his patience, and also be made partakers of his resurrection; through the same Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Proper 13": "O Lord, we beseech thee, let thy continual pity cleanse and defend thy Church, and, because it cannot continue in safety without thy succor, preserve it evermore by thy help and goodness; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Proper 16": "Grant, we beseech thee, merciful God, that thy Church, being gathered together in unity by thy Holy Spirit, may manifest thy power among all peoples, to the glory of thy Name; through Jesus Christ our Lord, who liveth and reigneth with thee and the same Spirit, one God, world without end. Amen.",
 "Fifth Sunday after the Epiphany": "Set us free, O God, from the bondage of our sins and give us, we beseech thee, the liberty of that abundant life which thou hast manifested to us in thy Son our Savior Jesus Christ; who liveth and reigneth with thee, in the unity of the Holy Spirit, one God, now and for ever. Amen.",
 "Fifth Sunday in Lent": "O Almighty God, who alone canst order the unruly wills and affections of sinful men: Grant unto thy people that they may love the thing which thou commandest, and desire that which thou dost promise; that so, among the sundry and manifold changes of the world, our hearts may surely there be fixed where true joys are to be found; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, now and for ever. Amen.",
 "Proper 21": "O God, who declarest thy almighty power chiefly in showing mercy and pity: Mercifully grant unto us such a measure of thy grace, that we, running to obtain thy promises, may be made partakers of thy heavenly treasure; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Seventh Sunday after the Epiphany": "O Lord, who hast taught us that all our doings without charity are nothing worth: Send thy Holy Ghost and pour into our hearts that most excellent gift of charity, the very bond of peace and of all virtues, without which whosoever liveth is counted dead before thee. Grant this for thine only Son Jesus Christ's sake, who liveth and reigneth with thee and the same Holy Ghost, one God, now and for ever. Amen.",
 "The Nativity of Our Lord:  Christmas Day": "O God, who makest us glad with the yearly remembrance of the birth of thy only Son Jesus Christ: Grant that as we joyfully receive him for our Redeemer, so we may with sure confidence behold him when he shall come to be our Judge; who liveth and reigneth with thee and the Holy Ghost, one God, world without end. Amen.",
 "Proper 10": "O Lord, we beseech thee mercifully to receive the prayers of thy people who call upon thee, and grant that they may both perceive and know what things they ought to do, and also may have grace and power faithfully to fulfill the same; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, now and for ever. Amen.",
 "Proper 3": "Grant, O Lord, we beseech thee, that the course of this world may be peaceably governed by thy providence, and that thy Church may joyfully serve thee in confidence and serenity; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
 "Proper 7": "O Lord, we beseech thee, make us to have a perpetual fear and love of thy holy Name, for thou never failest to help and govern those whom thou hast set upon the sure foundation of thy loving-kindness; through Jesus Christ our Lord, who liveth and reigneth with thee and the Holy Spirit, one God, for ever and ever. Amen.",
}

def norm(t):
    t = t.replace("=", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t

d = json.load(open(SCRATCH / "collects.json"))
trad = {c["title"]: c for c in d["traditional"]["church-year"]}
missing = [t for t in AUTHORITATIVE if t not in trad]
corrupt = []
ok = []
for t, auth in AUTHORITATIVE.items():
    if t not in trad:
        continue
    got = norm(trad[t]["text"])
    a = norm(auth)
    # bigram overlap on first 12 words
    gw = re.findall(r"[a-z']+", got.lower())[:14]
    aw = re.findall(r"[a-z']+", a.lower())[:14]
    # exact word-sequence match of the middle clause to detect joins
    if got == a or got.rstrip(".") == a.rstrip("."):
        ok.append(t); continue
    gb = set(" ".join(gw[i:i+2]) for i in range(len(gw)-1))
    ab = set(" ".join(aw[i:i+2]) for i in range(len(aw)-1))
    ov = len(gb & ab)/max(1,len(ab))
    (ok if ov >= 0.9 else corrupt).append((t, ov))
print("MISSING (need insert):", len(missing))
for m in missing: print("   ", m)
print()
print("CORRUPT (need replace):")
for t, ov in sorted(corrupt, key=lambda x: x[1]): print(f"   {ov:.2f} {t}")
print()
print("OK:", len(ok), ok)
