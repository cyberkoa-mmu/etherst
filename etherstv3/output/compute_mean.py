from math import ceil, floor
from pathlib import Path
from collections import OrderedDict


import pandas as pd
import matplotlib.pyplot as plt
import numpy as np


def find_mean(path):
    df = pd.read_csv(
        # 'sim_diff_levels/result/trust-1_untrust-5_totalNodes-30_badPercent-20_goodPercent-20.csv',
        path,
        skiprows=9,
        nrows=30,
        header=None,
        usecols=[0,1],
        names=['type', 'bal']
    )
    # print('Contents of the Dataframe created by skipping top 9 lines from csv file ')
    # print(df)

    df1 = df.groupby(['type']).mean()

    # print(df1)
    return df1



def generate_x_trust_y_untrust_data_balance():
    data_b = {}
    data_n = {}
    data_g = {}

    for path in Path("sim_diff_levels/result/").glob("**/*.csv"):
        # print(path)
        # print(path.name)
        tokens = path.name.split("_")
        trust_level = tokens[0][-1:]
        untrust_level = tokens[1][-1:]
        # print(f"trust_level: {trust_level}, untrust_level: {untrust_level}")

        if f'{untrust_level}' not in data_b:
            data_b[f'{untrust_level}'] = {}
            data_g[f'{untrust_level}'] = {}
            data_n[f'{untrust_level}'] = {}
        
        if f'{trust_level}' not in data_b[f'{untrust_level}']:
            data_b[f'{untrust_level}'][f'{trust_level}'] = {}
            data_g[f'{untrust_level}'][f'{trust_level}'] = {}
            data_n[f'{untrust_level}'][f'{trust_level}'] = {}
        
        df = find_mean(str(path))
        data_b[f'{untrust_level}'][f'{trust_level}'] = df._get_value('B', 'bal')
        data_g[f'{untrust_level}'][f'{trust_level}'] = df._get_value('G', 'bal')
        data_n[f'{untrust_level}'][f'{trust_level}'] = df._get_value('N', 'bal')
        # print(data[f't{trust_level}'][f'u{untrust_level}'])
        # print("-"*18)

    df_b = pd.DataFrame(data_b)
    df_g = pd.DataFrame(data_g)
    df_n = pd.DataFrame(data_n)

    print("DF B")
    print("-" * 80)
    df_b = df_b.sort_index(axis=1).sort_index()


    print("DF G")
    print("-" * 80)

    df_g = df_g.sort_index(axis=1).sort_index()


    print("DF N")
    print("-" * 80)

    df_n = df_n.sort_index(axis=1).sort_index()

    return {'df_b': df_b, 'df_g': df_g, 'df_n': df_n}


def generate_x_trust_y_untrust_data_balance_new():
    data_b = {'trust_level': [], 'untrust_level': [], 'balance': []}
    data_g = {'trust_level': [], 'untrust_level': [], 'balance': []}
    data_n = {'trust_level': [], 'untrust_level': [], 'balance': []}
    
    for path in Path("sim_diff_levels/result/").glob("**/*.csv"):
        # print(path)
        # print(path.name)
        tokens = path.name.split("_")
        trust_level = tokens[0][-1:]
        untrust_level = tokens[1][-1:]
        # print(f"trust_level: {trust_level}, untrust_level: {untrust_level}")

        df = find_mean(str(path))

        data_b['trust_level'].append(trust_level)
        data_b['untrust_level'].append(untrust_level)
        data_b[f'balance'].append(df._get_value('B', 'bal'))

        data_g['trust_level'].append(trust_level)
        data_g['untrust_level'].append(untrust_level)
        data_g[f'balance'].append(df._get_value('G', 'bal'))

        data_n['trust_level'].append(trust_level)
        data_n['untrust_level'].append(untrust_level)
        data_n[f'balance'].append(df._get_value('N', 'bal'))
        # print(data[f't{trust_level}'][f'u{untrust_level}'])
        # print("-"*18)

    df_b = pd.DataFrame(data_b)
    df_g = pd.DataFrame(data_g)
    df_n = pd.DataFrame(data_n)

    print("DF B")
    print("-" * 80)
    # df_b = df_b.sort_index()


    print("DF G")
    print("-" * 80)

    # df_g = df_g.sort_index()


    print("DF N")
    print("-" * 80)

    # df_n = df_n.sort_index(axis=1).sort_index()

    return {'df_b': df_b, 'df_g': df_g, 'df_n': df_n}


def generate_x_trust_per_untrust_y_balance():
    data_b = {'x': [], 'bal': []}
    data_n = {'x': [], 'bal': []}
    data_g = {'x': [], 'bal': []}

    for path in Path("sim_diff_levels/result/").glob("**/*.csv"):
        # print(path)
        # print(path.name)
        tokens = path.name.split("_")
        trust_level = tokens[0][-1:]
        untrust_level = tokens[1][-1:]
        # print(f"trust_level: {trust_level}, untrust_level: {untrust_level}")

        df = find_mean(str(path))

        data_b['x'].append(float(trust_level)/float(untrust_level))
        data_b['bal'].append(df._get_value('B', 'bal'))

        data_g['x'].append(float(trust_level)/float(untrust_level))
        data_g['bal'].append(df._get_value('G', 'bal'))

        data_n['x'].append(float(trust_level)/float(untrust_level))
        data_n['bal'].append(df._get_value('N', 'bal'))


    df_b = pd.DataFrame(data_b)
    df_g = pd.DataFrame(data_g)
    df_n = pd.DataFrame(data_n)

    print("DF B")
    print("-" * 80)
    df_b = df_b.sort_values(by=['x']).set_index('x')

    print(df_b)

    print("DF G")
    print("-" * 80)

    df_g = df_g.sort_values(by=['x']).set_index('x')
    print(df_g)

    print("DF N")
    print("-" * 80)

    df_n = df_n.sort_values(by=['x']).set_index('x')
    print(df_n)

    return {'df_b': df_b, 'df_g': df_g, 'df_n': df_n}



def generate_x_trust_y_untrust_data_balance_graph(df_b, df_g, df_n):
    # colors = np.random.rand(81)

    # df_b = df_b.sort_values(
    #     ['trust_level', 'untrust_level'],
    #     ascending=[True, True],
    #     ignore_index=True
    # )
    # df_b.plot(
    #     kind='scatter',
    #     x='trust_level',
    #     y='untrust_level',
    #     s='balance',
    #     c=colors,
    #     alpha=0.5,
    #     vmin=0,
    #     vmax=0
    # )

    # levels = sorted(df_b['trust_level'].values.tolist())

    for level in range(1, 10):
        print(f"level : {level}")
        level = str(level)
        df_b_sub = df_b.loc[df_b['trust_level'] == level].sort_values('untrust_level')
        df_g_sub = df_g.loc[df_g['trust_level'] == level].sort_values('untrust_level')
        df_n_sub = df_n.loc[df_n['trust_level'] == level].sort_values('untrust_level')


        df = pd.DataFrame(
            {
                'Bad': df_b_sub['balance'].tolist(),
                'Good': df_g_sub['balance'].tolist(),
                'Normal': df_n_sub['balance'].tolist(),
            },
            index=range(1, 10)
        )
        # print(df)
        figure = plt.gcf() # get current figure
        plt.rcParams.update({'font.size': 16}) # must set in top

        df.plot.line(
            xticks=np.arange(1, 10),
            xlabel='Untrust Level',
            ylabel='PKIToken balance',
            title=f'PKIToken balance when Trust Level = {level}',
            # fontsize=18
        )

        filename = f"graphs/compare_node_types_balance_{level}.png"
        # print(filename)


        figure.set_size_inches(10.24, 7.68)
        plt.tight_layout()
        plt.savefig(filename, dpi=100)
        # plt.show()


    # Adding labels and title
    #plt.xlabel('Trust')
    #plt.ylabel('Untrust')
    #plt.title('PKIToken balance after simulation')

    # Displaying the plot
    #plt.show()

def generate_x_untrust_y_data_balance_multiple_trust_graph_by_type(df_type, node_type):

    x_start = 9
    X_END = 12
    x_end = 10
    PAD = 0.1

    data = {}

    for level in range(1, 10):
        level = str(level)

        df_type_sub = df_type.loc[df_type['trust_level'] == level].sort_values('untrust_level')

        data[level] = df_type_sub['balance'].tolist()


    df_type_new = pd.DataFrame(
        data,
        index=range(1, 10)
    )
    # print(df_type_new)

    min_value = df_type_new.values.min()
    max_value = df_type_new.values.max()
    # print(f"\nmin : {min_value}, max: {max_value}\n")
    
    min_y = max([(floor(min_value / 10) - 1) * 10, 0])
    max_y = min([(ceil(max_value / 10) + 1) * 10, 60])


    df_type_new.plot.line(
        xticks=np.arange(1, 10),
        yticks=np.arange(min_y, max_y, 10),
        xlabel='Untrust Level',
        ylabel='PKIToken balance',
        title=f'PKIToken balance for Trust Level 1 - 9'
        # fontsize=12
    )

    ax = plt.gca()
    ax.set_xlim(1, X_END)
    ax.set_ylim(min_y, max_y)


    y_start_end = {}

    for level in range(1, 10):
        level = str(level)
        y_start = df_type_new[level].values[-1]
        y_end = y_start + y_start - df_type_new[level].values[-2]
        
        # print(f"y_start: {y_start}, y_end: {y_end}")
        y_start_end[level] = [x_start, x_end, y_start, y_end]

    df_temp = pd.DataFrame(
        y_start_end,
        index=['x_start', 'x_end', 'y_start', 'y_end']
    )


    # print(df_temp)
    df_temp.sort_values(by=['y_end', 'y_start'], axis=1, inplace=True)


    alternate_data = df_temp.T.index.tolist()[::2]
    # df_temp = df_temp.transpose()

    for level in range(1, 10):
        color = f'C{level - 1}'
        level = str(level)
        y_start = df_type_new[level].values[-1]
        y_end = y_start + y_start - df_type_new[level].values[-2]

        x_end = 10 + (1 if level in alternate_data else 0)

        ax.plot(
            [x_start, (x_start + x_end - PAD) / 2 , x_end - PAD], 
            [y_start, y_end, y_end], 
            color=color, 
            alpha=0.5, 
            ls="dashed"
        ) #  if level in ['1', '2', '3', '6', '9'] else None
        ax.text(
            x_end, 
            y_end, 
            f"trust={level}", 
            color=color,
            fontsize=12, 
            # weight="bold", 
            # fontfamily="Montserrat", 
            va="center"
        ) #  if level in ['1', '3', '6', '9'] else None

    filename = f"graphs/balance_trust_untrust_{node_type}.png"
    # print(filename)

    figure = plt.gcf() # get current figure
    figure.set_size_inches(10.24, 7.68)
    plt.legend('', frameon=False)
    plt.savefig(filename, dpi=100)

def generate_x_untrust_y_data_balance_multiple_trust_graph(df_b, df_g, df_n):

    generate_x_untrust_y_data_balance_multiple_trust_graph_by_type(df_b, 'bad')
    generate_x_untrust_y_data_balance_multiple_trust_graph_by_type(df_g, 'good')
    generate_x_untrust_y_data_balance_multiple_trust_graph_by_type(df_n, 'normal')


def generate_x_trust_per_untrust_y_balance_graph(df_b, df_g, df_n):

    df_b['trust_level'] = df_b['trust_level'].astype(float)
    df_b['untrust_level'] = df_b['untrust_level'].astype(float)
    df_b = df_b.sort_values('trust_level', ascending=True)

    df_g['trust_level'] = df_g['trust_level'].astype(float)
    df_g['untrust_level'] = df_g['untrust_level'].astype(float)
    df_g = df_g.sort_values('trust_level', ascending=True)

    df_n['trust_level'] = df_n['trust_level'].astype(float)
    df_n['untrust_level'] = df_n['untrust_level'].astype(float)
    df_n = df_n.sort_values('trust_level', ascending=True)
    print(f"df_b : {df_b}")

    df_b['tu_ratio'] = df_b['trust_level'] / df_b['untrust_level']
    df_g['tu_ratio'] = df_g['trust_level'] / df_g['untrust_level']
    df_n['tu_ratio'] = df_n['trust_level'] / df_n['untrust_level']

    print(f"df_b : {df_b}")
    #define how to aggregate various fields
    agg_functions = {'tu_ratio': 'first', 'balance': 'mean'}

    #create new DataFrame by combining rows with same id values
    df_b_new = df_b.groupby(df_b['tu_ratio']).aggregate(agg_functions)
    df_g_new = df_g.groupby(df_g['tu_ratio']).aggregate(agg_functions)
    df_n_new = df_n.groupby(df_n['tu_ratio']).aggregate(agg_functions)

    #view new DataFrame
    print(df_b_new)


    df = pd.DataFrame(
        {
            'Bad': df_b_new['balance'],
            'Good': df_g_new['balance'],
            'Normal': df_n_new['balance']
        },
        index=df_b_new.index.values.tolist()
    )


    df.plot.line(
        xticks=np.arange(0, 9.5, 0.5),
        xlabel='Ratio of Trust Level / Untrust Level',
        ylabel='PKIToken balance',
        # fontsize=12
    )

    # plt.show()

    filename = f"graphs/balance_trust_per_untrust.png"
    # print(filename)

    figure = plt.gcf() # get current figure
    figure.set_size_inches(10.24, 7.68)
    # plt.legend('', frameon=False)
    plt.savefig(filename, dpi=100)




def output_to_table(filename, df_b, df_g, df_n, **kwargs):
    with pd.ExcelWriter(filename) as writer:  
        df_b.to_excel(writer, sheet_name='Bad')
        df_g.to_excel(writer, sheet_name='Good')
        df_n.to_excel(writer, sheet_name='Normal')


# output_to_table('graph-data_x_trust_y_untrust_data_balance.xlsx', **generate_x_trust_y_untrust_data_balance())

# output_to_table('graph-data_x_trust_per_untrust_y_balance.xlsx', **generate_x_trust_per_untrust_y_balance())

# generate_x_trust_y_untrust_data_balance_graph(**generate_x_trust_y_untrust_data_balance())


# Success
# generate_x_trust_per_untrust_y_balance_graph(**generate_x_trust_per_untrust_y_balance())


generate_x_trust_y_untrust_data_balance_graph(**generate_x_trust_y_untrust_data_balance_new())



# generate_x_untrust_y_data_balance_multiple_trust_graph(**generate_x_trust_y_untrust_data_balance_new())

# generate_x_trust_per_untrust_y_balance_graph(**generate_x_trust_y_untrust_data_balance_new())