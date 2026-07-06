"""
retrain.py — Script de ré-entraînement du modèle TaskHoursEstimator
=====================================================================

FEATURES AJOUTÉES PAR RAPPORT À L'ANCIEN MODÈLE :
  • memberAvgCompletionHours  : temps moyen réel du membre pour finir une tâche
  • memberAvgDelayHours       : retard moyen observé chez ce membre
  • memberCompletedTasksCount : nombre de tâches déjà terminées (fiabilité des stats)
  • memberAvgReopenRate       : taux moyen de réouverture (qualité du travail)
  • memberCurrentWorkload     : charge actuelle (tâches actives non terminées)
  • memberAvgWorkLogHours     : heures réelles loguées en moyenne
  • memberAvgStoryPoints      : story points moyens des tâches complétées

UTILISATION :
  python retrain.py

SORTIE :
  best_model_RandomForest.pkl   ← remplace l'ancien fichier
  training_data_enriched.csv    ← données générées pour audit/visualisation
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings("ignore")

# ─── 1. GÉNÉRATION DES DONNÉES D'ENTRAÎNEMENT ────────────────────────────────
# On génère un dataset synthétique réaliste qui intègre les nouvelles features.
# Remplacez cette section par vos vraies données si vous en avez (export DB, CSV...).

np.random.seed(42)
N = 5000  # nombre d'exemples

# Distributions réalistes
task_types    = np.random.choice(['Feature', 'Bug', 'Improvement', 'Technical Debt', 'Spike'], N,
                                  p=[0.40, 0.25, 0.15, 0.10, 0.10])
priorities    = np.random.choice(['Low', 'Medium', 'High', 'Critical'], N, p=[0.15, 0.40, 0.35, 0.10])
story_points  = np.random.choice([1, 2, 3, 5, 8, 13, 21], N, p=[0.10, 0.15, 0.25, 0.25, 0.15, 0.07, 0.03])
complexity    = np.random.randint(1, 6, N)      # 1–5
risk_level    = np.random.randint(1, 6, N)      # 1–5
has_blocking  = np.random.choice([True, False], N, p=[0.25, 0.75])
deps_count    = np.random.choice([0, 1, 2, 3, 4], N, p=[0.50, 0.25, 0.15, 0.07, 0.03])
member_levels = np.random.choice(['Junior', 'Senior', 'Expert'], N, p=[0.40, 0.40, 0.20])

# Nouvelles features historiques membres
member_avg_completion = np.random.uniform(2, 40, N)     # heures moyennes réelles
member_avg_delay      = np.abs(np.random.normal(1, 3, N))  # retard moyen (toujours >= 0)
member_completed_count = np.random.randint(0, 100, N)   # tâches terminées
member_reopen_rate    = np.random.uniform(0, 0.5, N)    # 0 = jamais réouvert, 0.5 = souvent
member_workload       = np.random.randint(0, 15, N)     # tâches actives actuellement
member_avg_worklog    = np.random.uniform(1, 35, N)     # heures loguées réelles en moyenne
member_avg_sp         = np.random.uniform(1, 10, N)     # story points moyens traités

# ─── Simulation de la durée réelle (la cible Y) ──────────────────────────────
# Formule réaliste intégrant toutes les features :
base_hours = story_points * 1.5

# Impact des features task
type_factor = np.where(task_types == 'Bug', 0.8,
              np.where(task_types == 'Spike', 1.5,
              np.where(task_types == 'Technical Debt', 1.3, 1.0)))
priority_factor = np.where(priorities == 'Critical', 1.4,
                  np.where(priorities == 'High', 1.2,
                  np.where(priorities == 'Low', 0.8, 1.0)))
complexity_factor = 0.5 + complexity * 0.25     # 0.75–1.75
risk_factor       = 1.0 + risk_level * 0.08     # 1.08–1.40
blocking_factor   = np.where(has_blocking, 1.3, 1.0)

# Impact des features membre (NOUVELLES)
level_factor = np.where(member_levels == 'Expert', 0.65,
               np.where(member_levels == 'Senior', 0.85, 1.0))

# Si le membre prend habituellement 20% plus que l'estimation → le modèle l'apprend
history_correction = member_avg_completion / np.maximum(base_hours * type_factor * priority_factor, 1)
history_correction = np.clip(history_correction, 0.5, 2.5)  # éviter les extrêmes

workload_penalty  = 1.0 + member_workload * 0.03   # +3% par tâche active
reopen_penalty    = 1.0 + member_reopen_rate * 0.5 # +50% si réouverture fréquente
delay_factor      = 1.0 + np.minimum(member_avg_delay / 20, 0.3)  # max +30%

actual_hours = (base_hours
                * type_factor
                * priority_factor
                * complexity_factor
                * risk_factor
                * blocking_factor
                * level_factor
                * history_correction
                * workload_penalty
                * reopen_penalty
                * delay_factor)

# Bruit réaliste ±15%
actual_hours = actual_hours * np.random.uniform(0.85, 1.15, N)
actual_hours = np.clip(actual_hours, 0.5, 200)  # bornes réalistes

# ─── 2. CONSTRUCTION DU DATAFRAME ────────────────────────────────────────────

df = pd.DataFrame({
    'type':                       task_types,
    'priority':                   priorities,
    'storyPoints':                story_points,
    'complexityScore':            complexity,
    'riskLevel':                  risk_level,
    'hasBlockingDependencies':    has_blocking.astype(int),
    'dependenciesCount':          deps_count,
    'memberLevel':                member_levels,
    # ── Nouvelles features ──
    'memberAvgCompletionHours':   np.round(member_avg_completion, 2),
    'memberAvgDelayHours':        np.round(member_avg_delay, 2),
    'memberCompletedTasksCount':  member_completed_count,
    'memberAvgReopenRate':        np.round(member_reopen_rate, 3),
    'memberCurrentWorkload':      member_workload,
    'memberAvgWorkLogHours':      np.round(member_avg_worklog, 2),
    'memberAvgStoryPoints':       np.round(member_avg_sp, 2),
    # Cible
    'actualHours':                np.round(actual_hours, 2),
})

df.to_csv('training_data_enriched.csv', index=False)
print(f"✅ Dataset généré : {len(df)} exemples")
print(df.describe())

# ─── 3. PRÉPARATION DES FEATURES ─────────────────────────────────────────────

# One-Hot Encoding des catégories (identique à app.py)
X = pd.get_dummies(df.drop('actualHours', axis=1),
                   columns=['type', 'priority', 'memberLevel'])

y = df['actualHours']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print(f"\n📊 Train: {len(X_train)} | Test: {len(X_test)}")
print(f"📌 Features ({len(X.columns)}) :", list(X.columns))

# ─── 4. ENTRAÎNEMENT + OPTIMISATION ──────────────────────────────────────────

print("\n🔄 Entraînement RandomForest avec GridSearch...")

param_grid = {
    'n_estimators':      [200, 400],
    'max_depth':         [None, 15, 25],
    'min_samples_split': [2, 5],
    'max_features':      ['sqrt', 'log2'],
}

rf = RandomForestRegressor(random_state=42, n_jobs=-1)
grid_search = GridSearchCV(
    rf, param_grid,
    cv=5, scoring='neg_mean_absolute_error',
    n_jobs=-1, verbose=1
)
grid_search.fit(X_train, y_train)

best_model = grid_search.best_estimator_
print(f"\n🏆 Meilleurs paramètres : {grid_search.best_params_}")

# ─── 5. ÉVALUATION ────────────────────────────────────────────────────────────

y_pred = best_model.predict(X_test)
mae    = mean_absolute_error(y_test, y_pred)
r2     = r2_score(y_test, y_pred)

print(f"\n📈 Résultats sur le test set :")
print(f"   MAE (erreur absolue moyenne) : {mae:.2f} heures")
print(f"   R²  (qualité de fit)         : {r2:.4f}  (1.0 = parfait)")

# Importance des features
feature_importance = pd.DataFrame({
    'feature':    X.columns,
    'importance': best_model.feature_importances_,
}).sort_values('importance', ascending=False)

print(f"\n🔑 Top 15 features les plus importantes :")
print(feature_importance.head(15).to_string(index=False))

# ─── 6. SAUVEGARDE DU MODÈLE ─────────────────────────────────────────────────

output_path = 'best_model_RandomForest.pkl'
joblib.dump(best_model, output_path)
print(f"\n💾 Modèle sauvegardé → {output_path}")
print(f"   Colonnes attendues par le modèle : {list(best_model.feature_names_in_)}")
print("\n✅ Ré-entraînement terminé. Redéployez app.py + best_model_RandomForest.pkl sur Render.")
