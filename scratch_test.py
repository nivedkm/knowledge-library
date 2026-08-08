import sys
import os

# add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.application.search.ranking import score_hit

def embed(text):
    vectors = []
    seed = sum(ord(character) for character in text)
    vectors.append([
        float((seed + index * 31) % 997) / 997.0
        for index in range(384)
    ])
    return vectors[0]

q1 = "How does retrieval practice help recall?"
c1 = "Recalling knowledge strengthens later recall."
q1_emb = embed(q1)
c1_emb = [1.0] * 384

def cosine_dist(u, v):
    dot = sum(a*b for a, b in zip(u, v))
    mag_u = sum(a*a for a in u)**0.5
    mag_v = sum(b*b for b in v)**0.5
    return 1.0 - (dot / (mag_u * mag_v))

dist1 = cosine_dist(q1_emb, c1_emb)
print("dist1:", dist1)

q2 = "What helps me focus?"
c2 = "Protect uninterrupted focus to get difficult work done."
q2_emb = embed(q2)
c2_emb = embed(c2)
dist2 = cosine_dist(q2_emb, c2_emb)
print("dist2:", dist2)
