import pandas as pd
import os

file_path = r'D:\biju project.xlsx'

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheets: {xl.sheet_names}")
    for sheet in xl.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=5)
        print(f"\nSheet: {sheet}")
        print(f"Columns: {df.columns.tolist()}")
        print("First 2 rows:")
        print(df.head(2).to_string())
except Exception as e:
    print(f"Error: {e}")
